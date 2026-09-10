import type { ComponentType } from "react";
import type { PageAccent } from "../components/PageHeader";
import { BasketIcon, ClipboardIcon, LeafIcon, UsersIcon } from "../components/icons";
import type { Category } from "../types/task";

// Section 3 of the design spec: Study/Work -> blue, Health -> green,
// People -> purple, Chores -> orange. Kept in one place so the workload
// cards, task list, and any future category chip stay in sync.
export const CATEGORY_META: Record<
  Category,
  { icon: ComponentType<{ className?: string }>; accent: PageAccent }
> = {
  study_work: { icon: ClipboardIcon, accent: "study" },
  health: { icon: LeafIcon, accent: "health" },
  people: { icon: UsersIcon, accent: "people" },
  chores: { icon: BasketIcon, accent: "chores" },
};
