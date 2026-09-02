// Throwaway test scaffolding — not part of the real room UI.
// Delete this whole src/dev/ folder (and the ?dev=true branch in App.tsx)
// once the real room is built; nothing else depends on it.
import { Fragment, useState } from "react";
import GoogleCalendarSync from "../components/GoogleCalendarSync";
import SpeechBubble from "../components/SpeechBubble";
import StickyNote from "../components/StickyNote";
import TaskInputModal from "../components/TaskInputModal";
import { runBurnoutCheck } from "../services/runBurnoutCheck";
import { runStructureNudge } from "../services/runStructureNudge";
import { useTaskStore } from "../store/useTaskStore";
import { BurnoutCheckResult, CATEGORIES, CATEGORY_LABELS } from "../types/task";

const STICKY_ROTATIONS = [-3, 2, -2, 3, -1.5];
const STICKY_COLORS: ("yellow" | "lavender")[] = ["yellow", "lavender"];

interface NudgeState {
  isLoading: boolean;
  reasoning: string | null;
  error: string | null;
}

export default function DevDashboard() {
  const tasks = useTaskStore((state) => state.tasks);
  const openTaskModal = useTaskStore((state) => state.openTaskModal);
  const removeTask = useTaskStore((state) => state.removeTask);
  const clearTasks = useTaskStore((state) => state.clearTasks);
  const toggleSubStepDone = useTaskStore((state) => state.toggleSubStepDone);

  const [isCheckingBurnout, setIsCheckingBurnout] = useState(false);
  const [burnoutResult, setBurnoutResult] = useState<BurnoutCheckResult | null>(null);

  const [nudgeState, setNudgeState] = useState<Record<string, NudgeState>>({});

  const handleTapBuddy = async () => {
    setIsCheckingBurnout(true);
    setBurnoutResult(null);
    const result = await runBurnoutCheck();
    setBurnoutResult(result);
    setIsCheckingBurnout(false);
  };

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
        error: result
          ? null
          : "Couldn't break this down right now, try again in a bit.",
      },
    }));
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24, fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>Dev Dashboard (later person A change it)</h1>
        <button
          type="button"
          onClick={clearTasks}
          style={{ padding: "6px 12px", border: "1px solid #c33", color: "#c33", background: "white", cursor: "pointer" }}
        >
          Clear all tasks
        </button>
      </div>

      <GoogleCalendarSync />

      <div style={{ marginBottom: 24, padding: 16, border: "1px solid #ccc", borderRadius: 8 }}>
        <button
          type="button"
          onClick={handleTapBuddy}
          disabled={isCheckingBurnout}
          style={{ padding: "8px 16px", cursor: isCheckingBurnout ? "not-allowed" : "pointer" }}
        >
          {isCheckingBurnout ? "Checking in…" : "Tap Buddy"}
        </button>

        {(isCheckingBurnout || burnoutResult) && (
          <div style={{ marginTop: 12 }}>
            <SpeechBubble isLoading={isCheckingBurnout} text={burnoutResult?.reasoning ?? null} />
          </div>
        )}

        {burnoutResult && !isCheckingBurnout && (
          <div style={{ marginTop: 16, padding: 8, background: "#f5f5f5", fontSize: 12, fontFamily: "monospace" }}>
            <div>overloadedCategory: {burnoutResult.overloadedCategory ?? "null"}</div>
            <div>
              urgentTaskIds ({burnoutResult.urgentTaskIds.length}):{" "}
              {burnoutResult.urgentTaskIds.length === 0
                ? "[]"
                : burnoutResult.urgentTaskIds
                    .map((id) => tasks.find((task) => task.id === id)?.title ?? `unknown:${id}`)
                    .join(", ")}
            </div>
            <div>
              nonUrgentTaskIds ({burnoutResult.nonUrgentTaskIds.length}):{" "}
              {burnoutResult.nonUrgentTaskIds.length === 0
                ? "[]"
                : burnoutResult.nonUrgentTaskIds
                    .map((id) => tasks.find((task) => task.id === id)?.title ?? `unknown:${id}`)
                    .join(", ")}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => openTaskModal(category)}
            style={{ padding: "16px 8px", border: "1px solid #999", borderRadius: 6, cursor: "pointer", background: "#f5f5f5" }}
          >
            {CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>

      {CATEGORIES.map((category) => {
        const categoryTasks = tasks.filter((task) => task.category === category);
        return (
          <div key={category} style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, marginBottom: 6 }}>
              {CATEGORY_LABELS[category]} ({categoryTasks.length})
            </h2>
            {categoryTasks.length === 0 ? (
              <p style={{ color: "#888", fontSize: 13, margin: 0 }}>No tasks</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
                    <th style={{ padding: "4px 6px" }}>Title</th>
                    <th style={{ padding: "4px 6px" }}>Priority</th>
                    <th style={{ padding: "4px 6px" }}>Load</th>
                    <th style={{ padding: "4px 6px" }}>Status</th>
                    <th style={{ padding: "4px 6px" }}>Due</th>
                    <th style={{ padding: "4px 6px" }} />
                  </tr>
                </thead>
                <tbody>
                  {categoryTasks.map((task) => {
                    const nudge = nudgeState[task.id];
                    return (
                      <Fragment key={task.id}>
                        <tr style={{ borderBottom: "1px solid #eee" }}>
                          <td style={{ padding: "4px 6px" }}>{task.title}</td>
                          <td style={{ padding: "4px 6px" }}>{task.priority}</td>
                          <td style={{ padding: "4px 6px" }}>{task.load}</td>
                          <td style={{ padding: "4px 6px" }}>{task.status}</td>
                          <td style={{ padding: "4px 6px" }}>
                            {task.dueAt ? new Date(task.dueAt).toLocaleString() : "—"}
                          </td>
                          <td style={{ padding: "4px 6px", whiteSpace: "nowrap" }}>
                            <button type="button" onClick={() => removeTask(task.id)} style={{ fontSize: 12 }}>
                              Remove
                            </button>
                            {task.priority === "urgent" && (
                              <button
                                type="button"
                                onClick={() => handleBreakDown(task.id)}
                                disabled={nudge?.isLoading}
                                style={{ fontSize: 12, marginLeft: 6 }}
                              >
                                {nudge?.isLoading ? "Breaking down…" : "Break this down"}
                              </button>
                            )}
                          </td>
                        </tr>
                        {(nudge?.isLoading || nudge?.error || (task.subSteps && task.subSteps.length > 0)) && (
                          <tr>
                            <td colSpan={6} style={{ padding: "8px 6px", background: "#fafafa" }}>
                              {nudge?.isLoading && (
                                <span style={{ fontSize: 12, color: "#888" }}>Breaking down…</span>
                              )}
                              {nudge?.error && (
                                <span style={{ fontSize: 12, color: "#c33" }}>{nudge.error}</span>
                              )}
                              {!nudge?.isLoading && task.subSteps && task.subSteps.length > 0 && (
                                <div>
                                  {nudge?.reasoning && (
                                    <p style={{ fontSize: 12, color: "#666", margin: "0 0 8px" }}>
                                      {nudge.reasoning}
                                    </p>
                                  )}
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
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
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        );
      })}

      <TaskInputModal />
    </div>
  );
}
