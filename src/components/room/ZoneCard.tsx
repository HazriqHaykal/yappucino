import { ACCENT_STYLES } from "../PageHeader";
import WorkloadBar from "../WorkloadBar";
import { CATEGORY_META } from "../../services/categoryMeta";
import { getWorkloadLevel, WORKLOAD_LEVEL_META } from "../../services/workloadLevel";
import type { Category } from "../../types/task";
import type { RoomZoneState } from "../../types/room";

const OVERDUE_TIP = "Something here is overdue.";

interface ZoneCardProps {
  category: Category;
  title: string;
  state: RoomZoneState;
  loadPercent: number;
  activeCount: number;
  overdueCount: number;
  onClick: () => void;
}

export default function ZoneCard({
  category,
  title,
  state,
  loadPercent,
  activeCount,
  overdueCount,
  onClick,
}: ZoneCardProps) {
  const { icon: Icon, accent } = CATEGORY_META[category];
  const styles = ACCENT_STYLES[accent];
  const level = getWorkloadLevel(loadPercent);
  const levelMeta = WORKLOAD_LEVEL_META[level];

  const status =
    state === "dim"
      ? OVERDUE_TIP
      : activeCount === 0
        ? "Nothing pending."
        : levelMeta.label;

  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-ring w-full rounded-2xl border border-line bg-paper-card p-4 text-left shadow-flat transition-transform hover:-translate-y-0.5 hover:shadow-pop sm:p-5"
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${styles.iconBg} ${styles.iconText}`}
          aria-hidden="true"
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1 truncate font-display text-sm font-semibold text-ink sm:text-base">
          {title}
        </span>
        <span
          className={`shrink-0 font-display text-base font-bold sm:text-lg ${
            state === "dim" ? "text-red-shade" : levelMeta.textClass
          }`}
        >
          {loadPercent}%
        </span>
      </div>

      <div className="mt-3">
        <WorkloadBar percent={state === "dim" ? Math.max(loadPercent, 70) : loadPercent} />
      </div>

      <p
        className={`mt-2 text-xs font-semibold sm:text-sm ${
          state === "dim" ? "text-red-shade" : levelMeta.textClass
        }`}
      >
        {status}
        {overdueCount > 0 && state !== "dim" ? ` · ${overdueCount} overdue` : ""}
      </p>
      <p className="mt-0.5 text-xs text-ink-faint">
        {activeCount} {activeCount === 1 ? "pending task" : "pending tasks"}
      </p>
    </button>
  );
}
