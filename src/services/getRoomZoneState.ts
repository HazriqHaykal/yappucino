import type { Category, Task } from "../types/task";
import type { RoomZoneSummary, RoomZoneState } from "../types/room";

const CLUTTERED_TASK_COUNT = 3;
const CLUTTERED_LOAD = 15;
// Load beyond this reads as "fully loaded" for the percent shown on a zone
// card — roughly two heavy (load 10) tasks stacked in one category.
const LOAD_PERCENT_CAP = 20;

// "bright" means zero pending tasks, not "recently finished one" — there's
// no completedAt/completeTask flow in the task store yet to detect that.
// Revisit once Person B's task model tracks completions.
export function getRoomZoneSummary(
  tasks: Task[],
  category: Category,
): RoomZoneSummary {
  const now = Date.now();
  const activeTasks = tasks.filter(
    (task) => task.category === category && task.status === "active",
  );
  const totalLoad = activeTasks.reduce((sum, task) => sum + task.load, 0);
  const overdueCount = activeTasks.filter(
    (task) => task.dueAt !== undefined && new Date(task.dueAt).getTime() < now,
  ).length;

  let state: RoomZoneState;
  if (overdueCount > 0) {
    state = "dim";
  } else if (
    activeTasks.length >= CLUTTERED_TASK_COUNT ||
    totalLoad >= CLUTTERED_LOAD
  ) {
    state = "cluttered";
  } else if (activeTasks.length === 0) {
    state = "bright";
  } else {
    state = "tidy";
  }

  return {
    category,
    state,
    activeCount: activeTasks.length,
    totalLoad,
    overdueCount,
    loadPercent: Math.min(100, Math.round((totalLoad / LOAD_PERCENT_CAP) * 100)),
  };
}
