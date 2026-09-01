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
}
