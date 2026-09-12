import { useMemo, useState } from "react";
import { getWorkloadOverview } from "../services/getWorkloadOverview";
import { runRebalanceNudge } from "../services/runRebalanceNudge";
import { runStructureNudge } from "../services/runStructureNudge";
import { CATEGORY_META } from "../services/categoryMeta";
import { useTaskStore } from "../store/useTaskStore";
import { CATEGORIES, CATEGORY_LABELS, type RebalanceNudgeResult, type Task } from "../types/task";
import AIInsightCard from "../components/AIInsightCard";
import GoogleCalendarSync from "../components/GoogleCalendarSync";
import PageHeader, { ACCENT_STYLES } from "../components/PageHeader";
import StickyNote from "../components/StickyNote";
import { CheckCircleIcon, SparkleIcon } from "../components/icons";

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

function formatDueDate(dueAt: string): string {
  return new Date(dueAt).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function isOverdue(task: Task): boolean {
  return task.dueAt !== undefined && new Date(task.dueAt).getTime() < Date.now();
}

export default function TasksPage() {
  const tasks = useTaskStore((state) => state.tasks);
  const removeTask = useTaskStore((state) => state.removeTask);
  const clearTasks = useTaskStore((state) => state.clearTasks);
  const toggleSubStepDone = useTaskStore((state) => state.toggleSubStepDone);
  const toggleTaskComplete = useTaskStore((state) => state.toggleTaskComplete);
  const deferTask = useTaskStore((state) => state.deferTask);

  const [nudgeState, setNudgeState] = useState<Record<string, NudgeState>>({});
  const [rebalanceState, setRebalanceState] = useState<Record<string, RebalanceState>>({});
  const [exitingTaskIds, setExitingTaskIds] = useState<Set<string>>(new Set());
  const [hiddenTaskIds, setHiddenTaskIds] = useState<Set<string>>(new Set());

  const overview = useMemo(() => getWorkloadOverview(tasks), [tasks]);

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

  const topLabel = CATEGORY_LABELS[overview.topCategory];

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
      <PageHeader
        title="Tasks"
        description="Everything on your plate this week, organized by area."
        action={
          <button
            type="button"
            onClick={clearTasks}
            className="focus-ring rounded-full border border-clay-light px-3 py-1.5 text-xs font-semibold text-clay-dark transition-colors hover:border-clay hover:bg-clay-light/40"
          >
            Clear all tasks
          </button>
        }
      />

      <AIInsightCard
        className="mb-6"
        insight={
          <>
            Your {topLabel} workload is currently{" "}
            <span className="font-semibold">{overview.topCategorySummary.loadPercent}%</span>.{" "}
            {overview.interpretation}
          </>
        }
        action={overview.suggestedAction}
      />

      <div className="mb-8">
        <GoogleCalendarSync />
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        {CATEGORIES.map((category) => {
          const { icon: CategoryIcon, accent } = CATEGORY_META[category];
          const styles = ACCENT_STYLES[accent];
          const categoryTasks = tasks.filter(
            (task) => task.category === category && !hiddenTaskIds.has(task.id),
          );
          const pendingCount = categoryTasks.filter((t) => t.status === "active").length;

          return (
            <div key={category}>
              <div className="mb-3 flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${styles.iconBg} ${styles.iconText}`}
                >
                  <CategoryIcon className="h-3.5 w-3.5" />
                </span>
                <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
                  {CATEGORY_LABELS[category]}
                </h2>
                <span className="text-xs font-semibold text-ink-faint">({pendingCount})</span>
              </div>

              {categoryTasks.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-faint">
                  No tasks yet.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {categoryTasks.map((task) => {
                    const nudge = nudgeState[task.id];
                    const rebalance = rebalanceState[task.id];
                    const isExiting = exitingTaskIds.has(task.id);
                    const done = task.status === "completed";
                    const overdue = !done && isOverdue(task);
                    const suggestStartToday =
                      !done && task.priority === "urgent" && !overdue;

                    return (
                      <li
                        key={task.id}
                        className={`rounded-2xl border p-4 shadow-flat transition-all ${
                          overdue ? "border-red-shade/40 bg-red-light/20" : "border-line bg-paper-card"
                        }`}
                        style={{
                          transitionDuration: `${DRAWER_ANIMATION_MS}ms`,
                          transform: isExiting ? "translateY(16px)" : "translateY(0)",
                          opacity: isExiting ? 0 : 1,
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => toggleTaskComplete(task.id)}
                            aria-label={done ? "Mark as not done" : "Mark as done"}
                            className={`focus-ring mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                              done
                                ? "border-mint-shade bg-mint-shade text-white"
                                : "border-ink-faint text-transparent hover:border-clay"
                            }`}
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <p
                                className={`font-display font-medium ${
                                  done ? "text-ink-faint line-through" : "text-ink"
                                }`}
                              >
                                {task.title}
                              </p>
                              {task.deferCount > 0 && (
                                <span className="rounded-full bg-line-soft px-2 py-0.5 text-[11px] font-semibold text-ink-soft">
                                  Moved {task.deferCount}x
                                </span>
                              )}
                            </div>

                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                  task.priority === "urgent"
                                    ? "bg-red-light text-red-shade"
                                    : "bg-line-soft text-ink-soft"
                                }`}
                              >
                                {task.priority === "urgent" ? "High priority" : "Non-urgent"}
                              </span>
                              <span className="rounded-full bg-line-soft px-2 py-0.5 text-[11px] font-semibold text-ink-soft">
                                Workload {task.load}/10
                              </span>
                              {task.dueAt && (
                                <span
                                  className={`text-[11px] font-semibold ${
                                    overdue ? "text-red-shade" : "text-ink-faint"
                                  }`}
                                >
                                  {overdue ? "Overdue" : "Due"} {formatDueDate(task.dueAt)}
                                </span>
                              )}
                            </div>

                            {suggestStartToday && (
                              <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-clay-dark">
                                <SparkleIcon className="h-3 w-3" />
                                AI suggests starting today
                              </p>
                            )}
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-1.5">
                            {task.priority === "urgent" && !done && (
                              <button
                                type="button"
                                onClick={() => handleBreakDown(task.id)}
                                disabled={nudge?.isLoading}
                                className="focus-ring rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink-soft transition-colors hover:border-clay hover:text-clay-dark disabled:opacity-50"
                              >
                                {nudge?.isLoading ? "Breaking down…" : "Break this down"}
                              </button>
                            )}
                            {task.priority === "non_urgent" && !done && (
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
                          <div className="mt-3 pl-8">
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
                          <div className="mt-3 pl-8">
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
