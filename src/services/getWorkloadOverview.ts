import { getRoomZoneSummary } from "./getRoomZoneState";
import { getWorkloadLevel } from "./workloadLevel";
import { CATEGORIES, CATEGORY_LABELS, type Category, type Task } from "../types/task";
import type { RoomZoneSummary } from "../types/room";

export interface WorkloadOverview {
  overallPercent: number;
  categories: RoomZoneSummary[];
  topCategory: Category;
  topCategorySummary: RoomZoneSummary;
  interpretation: string;
  suggestedAction: string;
}

// A synchronous, local read of "how loaded is this student right now" — no
// API call. This is what powers the always-on AI insight copy (dashboard
// interpretation, Tasks page insight card); the Gemini-backed burnout check
// on the Room page is the deeper, on-demand version of the same idea.
export function getWorkloadOverview(tasks: Task[]): WorkloadOverview {
  const categories = CATEGORIES.map((category) => getRoomZoneSummary(tasks, category));

  const overallPercent = Math.round(
    categories.reduce((sum, summary) => sum + summary.loadPercent, 0) / categories.length,
  );

  const topCategorySummary = categories.reduce((max, summary) =>
    summary.loadPercent > max.loadPercent ? summary : max,
  );
  const topCategory = topCategorySummary.category;
  const topLabel = CATEGORY_LABELS[topCategory];

  const overdueTotal = categories.reduce((sum, summary) => sum + summary.overdueCount, 0);
  const level = getWorkloadLevel(overallPercent);

  let interpretation: string;
  if (overdueTotal > 0) {
    interpretation = `You have ${overdueTotal} overdue ${overdueTotal === 1 ? "task" : "tasks"} — ${topLabel} is where it's piling up.`;
  } else if (level === "high") {
    interpretation = `You're carrying a lot right now. ${topLabel} is your heaviest area this week.`;
  } else if (level === "moderate") {
    interpretation = `You're doing okay, but ${topLabel} is getting heavier this week.`;
  } else if (categories.every((summary) => summary.activeCount === 0)) {
    interpretation = "Nothing pending anywhere — enjoy the calm.";
  } else {
    interpretation = "Your workload looks manageable today across the board.";
  }

  let suggestedAction: string;
  if (overdueTotal > 0) {
    suggestedAction = `Clear the overdue ${topLabel} task first, then take a short break.`;
  } else if (level === "high") {
    suggestedAction = `Move one ${topLabel} task to tomorrow and take a short break after your next one.`;
  } else if (level === "moderate") {
    suggestedAction = `Start one ${topLabel} task today so it doesn't stack up later this week.`;
  } else {
    suggestedAction = "No urgent action needed — a good day to get ahead on something small.";
  }

  return {
    overallPercent,
    categories,
    topCategory,
    topCategorySummary,
    interpretation,
    suggestedAction,
  };
}
