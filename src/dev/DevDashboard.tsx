// Throwaway test scaffolding — not part of the real room UI.
// Delete this whole src/dev/ folder (and the ?dev=true branch in App.tsx)
// once the real room is built; nothing else depends on it.
import TaskInputModal from "../components/TaskInputModal";
import { useTaskStore } from "../store/useTaskStore";
import { CATEGORIES, CATEGORY_LABELS } from "../types/task";

export default function DevDashboard() {
  const tasks = useTaskStore((state) => state.tasks);
  const openTaskModal = useTaskStore((state) => state.openTaskModal);
  const removeTask = useTaskStore((state) => state.removeTask);
  const clearTasks = useTaskStore((state) => state.clearTasks);

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
                  {categoryTasks.map((task) => (
                    <tr key={task.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "4px 6px" }}>{task.title}</td>
                      <td style={{ padding: "4px 6px" }}>{task.priority}</td>
                      <td style={{ padding: "4px 6px" }}>{task.load}</td>
                      <td style={{ padding: "4px 6px" }}>{task.status}</td>
                      <td style={{ padding: "4px 6px" }}>
                        {task.dueAt ? new Date(task.dueAt).toLocaleString() : "—"}
                      </td>
                      <td style={{ padding: "4px 6px" }}>
                        <button type="button" onClick={() => removeTask(task.id)} style={{ fontSize: 12 }}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
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
