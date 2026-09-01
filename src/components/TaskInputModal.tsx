import { FormEvent, useState } from "react";
import { useTaskStore } from "../store/useTaskStore";
import { CATEGORY_LABELS, Category, Task } from "../types/task";
import {
  CategoryCheckResult,
  checkCategoryMismatch,
} from "../services/checkCategoryMismatch";

const PRIORITY_OPTIONS: { value: Task["priority"]; label: string }[] = [
  { value: "non_urgent", label: "Non-urgent" },
  { value: "urgent", label: "Urgent" },
];

const emptyForm = {
  title: "",
  priority: "non_urgent" as Task["priority"],
  load: 5,
  dueAt: "",
};

interface PendingTask {
  title: string;
  priority: Task["priority"];
  load: number;
  dueAt?: string;
  result: CategoryCheckResult;
}

export default function TaskInputModal() {
  const isOpen = useTaskStore((state) => state.isTaskModalOpen);
  const activeCategory = useTaskStore((state) => state.activeCategory);
  const closeTaskModal = useTaskStore((state) => state.closeTaskModal);
  const addTask = useTaskStore((state) => state.addTask);

  const [form, setForm] = useState(emptyForm);
  const [isChecking, setIsChecking] = useState(false);
  const [pendingTask, setPendingTask] = useState<PendingTask | null>(null);

  if (!isOpen || !activeCategory) return null;

  const commitTask = (category: Category, task: Omit<PendingTask, "result">) => {
    addTask({
      title: task.title,
      category,
      priority: task.priority,
      load: task.load,
      dueAt: task.dueAt,
    });
    setForm(emptyForm);
    setPendingTask(null);
    closeTaskModal();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) return;

    const draft = {
      title,
      priority: form.priority,
      load: form.load,
      dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined,
    };

    console.log("[TaskInputModal] handleSubmit: calling checkCategoryMismatch with", {
      title,
      category: activeCategory,
    });
    setIsChecking(true);
    const result = await checkCategoryMismatch(title, activeCategory);
    setIsChecking(false);
    console.log("[TaskInputModal] handleSubmit: checkCategoryMismatch returned", result);

    if (result?.likelyMismatch) {
      console.log("[TaskInputModal] handleSubmit: mismatch detected, showing confirm dialog");
      setPendingTask({ ...draft, result });
      return;
    }

    console.log("[TaskInputModal] handleSubmit: no mismatch (or check skipped), committing directly");
    commitTask(activeCategory, draft);
  };

  const handleClose = () => {
    setForm(emptyForm);
    setPendingTask(null);
    closeTaskModal();
  };

  const loadPercent = ((form.load - 1) / 9) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-line bg-paper-card p-6 shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">
            New task for the desk
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="focus-ring rounded-full p-1 text-ink-faint hover:bg-line-soft hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {pendingTask ? (
          <div className="space-y-4">
            <p className="text-sm text-ink">{pendingTask.result.confirmMessage}</p>
            <div className="flex flex-col gap-2">
              {pendingTask.result.suggestedCategory && (
                <button
                  type="button"
                  onClick={() =>
                    commitTask(pendingTask.result.suggestedCategory!, pendingTask)
                  }
                  className="focus-ring rounded-full bg-clay px-4 py-2 font-display text-sm font-medium text-white hover:bg-clay-dark"
                >
                  Change to {CATEGORY_LABELS[pendingTask.result.suggestedCategory]}
                </button>
              )}
              <button
                type="button"
                onClick={() => commitTask(activeCategory, pendingTask)}
                className="focus-ring rounded-full border border-line px-4 py-2 font-display text-sm font-medium text-ink-soft hover:bg-line-soft"
              >
                Keep as {CATEGORY_LABELS[activeCategory]}
              </button>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="task-title"
              className="mb-1 block font-display text-sm font-medium text-ink"
            >
              Title
            </label>
            <input
              id="task-title"
              type="text"
              autoFocus
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Finish reading assignment"
              className="focus-ring w-full rounded-2xl border border-line bg-white px-3 py-2 text-ink placeholder:text-ink-faint"
            />
          </div>

          <div>
            <span className="mb-1 block font-display text-sm font-medium text-ink">
              Category
            </span>
            <span className="inline-flex items-center rounded-full bg-clay-light px-2.5 py-1 text-[0.6rem] font-display font-semibold uppercase tracking-wide text-clay-dark">
              {CATEGORY_LABELS[activeCategory]}
            </span>
          </div>

          <div>
            <span className="mb-1 block font-display text-sm font-medium text-ink">
              Priority
            </span>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((option) => {
                const selected = form.priority === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setForm({ ...form, priority: option.value })
                    }
                    className={`focus-ring flex-1 rounded-full border px-3 py-2 font-display text-sm font-medium transition ${
                      selected
                        ? "border-clay bg-clay text-white"
                        : "border-line bg-paper text-ink-soft hover:bg-line-soft"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="font-display text-sm font-medium text-ink">
                Effort load
              </span>
              <span className="font-display text-sm font-semibold text-clay">
                {form.load}/10
              </span>
            </div>
            <input
              id="task-load"
              type="range"
              min={1}
              max={10}
              value={form.load}
              onChange={(e) =>
                setForm({ ...form, load: Number(e.target.value) })
              }
              className="pace-slider w-full"
              style={{
                background: `linear-gradient(to right, #D9764A ${loadPercent}%, #ECDFCA ${loadPercent}%)`,
              }}
            />
          </div>

          <div>
            <label
              htmlFor="task-due"
              className="mb-1 block font-display text-sm font-medium text-ink"
            >
              Due date (optional)
            </label>
            <input
              id="task-due"
              type="datetime-local"
              value={form.dueAt}
              onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
              className="focus-ring w-full rounded-2xl border border-line bg-white px-3 py-2 text-ink"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="focus-ring rounded-full px-4 py-2 font-display text-sm font-medium text-ink-soft hover:bg-line-soft"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isChecking}
              className="focus-ring rounded-full bg-clay px-4 py-2 font-display text-sm font-medium text-white hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isChecking ? "Checking…" : "Add task"}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
