import type { RoomZoneState } from "../../types/room";

const STATE_META: Record<
  RoomZoneState,
  { label: string; labelClass: string; tip: string }
> = {
  tidy: { label: "Steady", labelClass: "text-ink-soft", tip: "Manageable for now." },
  cluttered: {
    label: "Heavy load",
    labelClass: "text-clay-dark",
    tip: "Tasks piling up here.",
  },
  dim: { label: "Overdue", labelClass: "text-ink-faint", tip: "Something's overdue." },
  bright: { label: "All clear", labelClass: "text-mint-shade", tip: "Nothing pending." },
};

interface ZoneCardProps {
  title: string;
  subtitle: string;
  state: RoomZoneState;
  loadPercent: number;
  onClick: () => void;
}

export default function ZoneCard({
  title,
  subtitle,
  state,
  loadPercent,
  onClick,
}: ZoneCardProps) {
  const meta = STATE_META[state];

  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-ring w-full rounded-2xl border border-line bg-paper-card px-6 py-5 text-left shadow-flat transition-transform hover:-translate-y-0.5 hover:shadow-pop"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-lg font-semibold text-ink">{title}</span>
        <span className="text-base font-bold text-ink-soft">{loadPercent}%</span>
      </div>
      <p className={`mt-1 text-sm font-semibold ${meta.labelClass}`}>{meta.label}</p>
      <p className="mt-1.5 text-sm leading-snug text-ink-soft">{meta.tip}</p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {subtitle}
      </p>
    </button>
  );
}
