import type { Category } from "./task";

export type RoomZoneState = "tidy" | "cluttered" | "dim" | "bright";

export interface RoomZoneSummary {
  category: Category;
  state: RoomZoneState;
  activeCount: number;
  totalLoad: number;
  overdueCount: number;
  loadPercent: number;
}
