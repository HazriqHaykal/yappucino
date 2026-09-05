import { useState } from "react";
import { runRebalanceNudge } from "../services/runRebalanceNudge";
import { runStructureNudge } from "../services/runStructureNudge";
import { useTaskStore } from "../store/useTaskStore";
import { CATEGORIES, CATEGORY_LABELS, type RebalanceNudgeResult } from "../types/task";
import GoogleCalendarSync from "./GoogleCalendarSync";
import StickyNote from "./StickyNote";

const STICKY_ROTATIONS = [-3, 2, -2, 3, -1.5];
const STICKY_COLORS: ("yellow" | "lavender")[] = ["yellow", "lavender"];
const DRAWER_ANIMATION_MS = 400;

interface NudgeState {
  isLoading: boolean;
  reasoning: string | null;
  error: string | null;
}

interface RebalanceState {
  isLoading: boolean;
  result: RebalanceNudgeResult | null;
  error: string | null;
}

export default function TaskBoard() {
  const tasks = useTaskStore((state) => state.tasks);
  const removeTask = useTaskStore((state) => state.removeTask);
  const clearTasks = useTaskStore((state) => state.clearTasks);
  const toggleSubStepDone = useTaskStore((state) => state.toggleSubStepDone);
  const deferTask = useTaskStore((state) => state.deferTask);

  const [nudgeState, setNudgeState] = useState<Record<string, NudgeState>>({});
  const [rebalanceState, setRebalanceState] = useState<Record<string, RebalanceState>>({});
  const [exitingTaskIds, setExitingTaskIds] = useState<Set<string>>(new Set());
  const [hiddenTaskIds, setHiddenTaskIds] = useState<Set<string>>(new Set());

  const handleBreakDown = async (taskId: string) => {
    setNudgeState((prev) => ({
      ...prev,
      [taskId]: { isLoading: true, reasoning: null, error: null },
    }));
    const result = await runStructureNudge(taskId);
    setNudgeState((prev) => ({
      ...prev,
      [taskId]: {
        isLoading: false,
        reasoning: result?.reasoning ?? null,
        error: result ? null : "Couldn't break this down right now, try again in a bit.",
      },
    }));
  };

  const handleRebalance = async (taskId: string) => {
    setRebalanceState((prev) => ({
      ...prev,
      [taskId]: { isLoading: true, result: null, error: null },
    }));
    const result = await runRebalanceNudge(taskId);
    setRebalanceState((prev) => ({
      ...prev,
      [taskId]: {
        isLoading: false,
        result,
        error: result ? null : "Couldn't check in on this right now, try again in a bit.",
      },
    }));
  };

  const handleDeferIt = (taskId: string) => {
    const deferUntil = rebalanceState[taskId]?.result?.suggestedDeferUntil;

    // Slide/fade the row out first, then actually apply the store change
    // and hide it once the animation has had time to play.
    setExitingTaskIds((prev) => new Set(prev).add(taskId));

    setTimeout(() => {
      deferTask(taskId, deferUntil);
      setHiddenTaskIds((prev) => new Set(prev).add(taskId));
      setExitingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      setRebalanceState((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
    }, DRAWER_ANIMATION_MS);
  };

  const handleKeepVisible = (taskId: string) => {
    setRebalanceState((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  };

  return (
    <div className="mx-auto mt-10 max-w-4xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-semibold text-ink">Tasks</h2>
        <button
          type="button"
          onClick={clearTasks}
          className="focus-ring rounded-full border border-clay-light px-3 py-1 text-xs font-semibold text-clay-dark transition-colors hover:border-clay hover:bg-clay-light/40"
        >
          Clear all tasks
        </button>
      </div>

      <GoogleCalendarSync />

      <div className="mt-6 grid gap-8 sm:grid-cols-2">
        {CATEGORIES.map((category) => {
          const categoryTasks = tasks.filter(
            (task) => task.category === category && !hiddenTaskIds.has(task.id),
          );
          return (
            <div key={category}>
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-soft">
                {CATEGORY_LABELS[category]} ({categoryTasks.length})
              </h2>
              {categoryTasks.length === 0 ? (
                <p className="mt-2 text-sm text-ink-faint">No tasks yet.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {categoryTasks.map((task) => {
                    const nudge = nudgeState[task.id];
                    const rebalance = rebalanceState[task.id];
                    const isExiting = exitingTaskIds.has(task.id);
                    return (
                      <li
                        key={task.id}
                        className="rounded-2xl border border-line bg-paper-card p-4 shadow-flat transition-all"
                        style={{
                          transitionDuration: `${DRAWER_ANIMATION_MS}ms`,
                          transform: isExiting ? "translateY(16px)" : "translateY(0)",
                          opacity: isExiting ? 0 : 1,
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-display font-medium text-ink">
                              {task.title}
                              {task.deferCount > 0 && (
                                <span className="ml-2 rounded-full bg-line-soft px-2 py-0.5 text-[11px] font-semibold text-ink-soft">
                                  Moved {task.deferCount}x
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-ink-soft">
                              {task.priority === "urgent" ? "Urgent" : "Non-urgent"} · load{" "}
                              {task.load} · {task.status}
                              {task.dueAt
                                ? ` · due ${new Date(task.dueAt).toLocaleDateString()}`
                                : ""}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {task.priority === "urgent" && (
                              <button
                                type="button"
                                onClick={() => handleBreakDown(task.id)}
                                disabled={nudge?.isLoading}
                                className="focus-ring rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink-soft transition-colors hover:border-clay hover:text-clay-dark disabled:opacity-50"
                              >
                                {nudge?.isLoading ? "Breaking down…" : "Break this down"}
                              </button>
                            )}
                            {task.priority === "non_urgent" && (
                              <button
                                type="button"
                                onClick={() => handleRebalance(task.id)}
                                disabled={rebalance?.isLoading}
                                className="focus-ring rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink-soft transition-colors hover:border-clay hover:text-clay-dark disabled:opacity-50"
                              >
                                {rebalance?.isLoading ? "Checking in…" : "Rebalance"}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeTask(task.id)}
                              className="focus-ring rounded-full px-2 py-1 text-xs text-ink-faint hover:text-clay-dark"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        {(nudge?.isLoading ||
                          nudge?.error ||
                          (task.subSteps && task.subSteps.length > 0)) && (
                          <div className="mt-3">
                            {nudge?.isLoading && (
                              <span className="text-xs text-ink-faint">Breaking down…</span>
                            )}
                            {nudge?.error && (
                              <span className="text-xs text-clay-dark">{nudge.error}</span>
                            )}
                            {!nudge?.isLoading && task.subSteps && task.subSteps.length > 0 && (
                              <div>
                                {nudge?.reasoning && (
                                  <p className="mb-2 text-xs text-ink-soft">{nudge.reasoning}</p>
                                )}
                                <div className="flex flex-wrap gap-3">
                                  {task.subSteps.map((step, i) => (
                                    <StickyNote
                                      key={step.id}
                                      text={step.text}
                                      done={step.done}
                                      onToggle={() => toggleSubStepDone(task.id, step.id)}
                                      rotationDeg={STICKY_ROTATIONS[i % STICKY_ROTATIONS.length]}
                                      color={STICKY_COLORS[i % STICKY_COLORS.length]}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {(rebalance?.isLoading || rebalance?.error || rebalance?.result) && (
                          <div className="mt-3">
                            {rebalance.isLoading && (
                              <span className="text-xs text-ink-faint">Checking in…</span>
                            )}
                            {rebalance.error && (
                              <span className="text-xs text-clay-dark">{rebalance.error}</span>
                            )}
                            {rebalance.result && (
                              <div className="rounded-xl border border-line-soft bg-paper p-3">
                                <p className="text-xs text-ink-soft">
                                  {rebalance.result.reasoning}
                                </p>
                                <div className="mt-2 flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleDeferIt(task.id)}
                                    className="focus-ring rounded-full bg-clay px-3 py-1 text-xs font-semibold text-white hover:bg-clay-dark"
                                  >
                                    Defer it
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleKeepVisible(task.id)}
                                    className="focus-ring rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink-soft hover:border-ink-faint"
                                  >
                                    Keep it visible
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
