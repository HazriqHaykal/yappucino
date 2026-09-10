// Shared 0-39/40-69/70-100 workload color system used by every progress
// bar and workload card in the app — keep thresholds in one place so the
// dashboard, room cards, and AI insight copy never disagree with each other.
export type WorkloadLevel = "low" | "moderate" | "high";

export function getWorkloadLevel(percent: number): WorkloadLevel {
  if (percent >= 70) return "high";
  if (percent >= 40) return "moderate";
  return "low";
}

export const WORKLOAD_LEVEL_META: Record<
  WorkloadLevel,
  { label: string; barClass: string; textClass: string; softBgClass: string }
> = {
  low: {
    label: "Manageable",
    barClass: "bg-mint-shade",
    textClass: "text-mint-shade",
    softBgClass: "bg-mint/25",
  },
  moderate: {
    label: "Moderate workload",
    barClass: "bg-yellow-shade",
    textClass: "text-yellow-shade",
    softBgClass: "bg-yellow/25",
  },
  high: {
    label: "High workload",
    barClass: "bg-red-shade",
    textClass: "text-red-shade",
    softBgClass: "bg-red/20",
  },
};
