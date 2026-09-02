// Mirrors docs/data-schema.md — keep in sync with the shared contract.

export type Category = "study_work" | "health" | "people" | "chores";

export const CATEGORIES: Category[] = [
  "study_work",
  "health",
  "people",
  "chores",
];

export const CATEGORY_LABELS: Record<Category, string> = {
  study_work: "Study/Work",
  health: "Health",
  people: "People",
  chores: "Chores",
};

export interface SubStep {
  id: string;
  text: string;
  done: boolean;
}

export interface BurnoutCheckResult {
  overloadedCategory: Category | null;
  reasoning: string;
  urgentTaskIds: string[];
  nonUrgentTaskIds: string[];
}

export interface StructureNudgeResult {
  taskId: string;
  subSteps: SubStep[];
  reasoning: string;
}

export interface RebalanceNudgeResult {
  taskId: string;
  reasoning: string;
  suggestedDeferUntil?: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  category: Category;
  priority: "urgent" | "non_urgent";
  load: number; // 1-10
  status: "active" | "deferred" | "completed";
  deferCount: number;
  subSteps?: SubStep[];
  source: "manual" | "calendar_sync";
  createdAt: string; // ISO timestamp
  dueAt?: string; // ISO timestamp
  completedAt?: string;
  externalId?: string; // e.g. Google Calendar event ID, used to dedupe re-syncs
}
