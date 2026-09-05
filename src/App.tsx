import CharacterCustomization from "./components/CharacterCustomization";
import TaskInputModal from "./components/TaskInputModal";
import DevDashboard from "./dev/DevDashboard";
import { useTaskStore } from "./store/useTaskStore";

function App() {
  const tasks = useTaskStore((state) => state.tasks);
  const openTaskModal = useTaskStore((state) => state.openTaskModal);
  const removeTask = useTaskStore((state) => state.removeTask);

  const screenParam = new URLSearchParams(window.location.search).get(
    "screen",
  );
  // Preview-only entry point until the Room Scene feature wires this into
  // the real first-run flow. Visit with ?screen=character.
  if (screenParam === "character") {
    return <CharacterCustomization />;
  }

  // Throwaway test surface — see src/dev/DevDashboard.tsx. Doesn't affect
  // the real room/desk-click flow below. Defaults on for `npm run dev` so
  // you don't have to type ?dev=true every time; add ?dev=false to preview
  // the real room while the dev server is running. Production builds
  // (import.meta.env.DEV is false) default to the real room regardless.
  const devParam = new URLSearchParams(window.location.search).get("dev");
  const isDevMode = devParam !== null ? devParam === "true" : import.meta.env.DEV;
  if (isDevMode) {
    return <DevDashboard />;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 font-display text-2xl font-bold text-ink">
          Pace (Hold dulu)
        </h1>

        {/* Desk zone — click to add a task, mirroring the room-interaction pattern */}
        <button
          type="button"
          onClick={() => openTaskModal("study_work")}
          className="focus-ring mb-6 flex h-40 w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-clay-light bg-paper-card text-ink-soft transition hover:border-clay hover:bg-clay-light/40"
        >
          <span className="text-3xl">🖥️</span>
          <span className="mt-2 font-display font-medium">
            Click the desk to add a task
          </span>
        </button>

        <ul className="space-y-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center justify-between rounded-2xl border border-line bg-paper-card px-4 py-3 shadow-flat"
            >
              <div>
                <p className="font-display font-medium text-ink">
                  {task.title}
                </p>
                <p className="text-xs text-ink-soft">
                  {task.category} · {task.priority} · load {task.load}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeTask(task.id)}
                className="focus-ring rounded-full px-2 py-1 text-sm text-ink-faint hover:text-clay-dark"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>

      <TaskInputModal />
    </div>
  );
}

export default App;
