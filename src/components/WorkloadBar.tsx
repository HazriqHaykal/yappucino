import { getWorkloadLevel, WORKLOAD_LEVEL_META } from "../services/workloadLevel";

interface WorkloadBarProps {
  percent: number;
  size?: "sm" | "lg";
}

export default function WorkloadBar({ percent, size = "sm" }: WorkloadBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const level = getWorkloadLevel(clamped);
  const meta = WORKLOAD_LEVEL_META[level];
  const height = size === "lg" ? "h-3" : "h-2";

  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-line-soft ${height}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out ${meta.barClass}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
