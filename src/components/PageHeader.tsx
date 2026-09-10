import type { ComponentType, ReactNode } from "react";

export type PageAccent = "study" | "health" | "people" | "chores" | "neutral";

// Category accent used by workload cards, task chips, and community activity
// icons — Study/Work -> blue, Health -> green, People -> purple, Chores ->
// orange (section 3 of the design spec). Full class strings are spelled out
// (not built from a template string) so Tailwind's content scan finds them.
// Not used by PageHeader itself: every top-level page header stays in the
// same clay brand color as the "Paceful" wordmark, so Room/Tasks/Community/
// Therapy all read as one consistent top level rather than four differently
// tinted pages.
export const ACCENT_STYLES: Record<
  PageAccent,
  { iconBg: string; iconText: string; border: string }
> = {
  study: { iconBg: "bg-sky/30", iconText: "text-sky-shade", border: "border-sky/40" },
  health: { iconBg: "bg-mint/30", iconText: "text-mint-shade", border: "border-mint/40" },
  people: { iconBg: "bg-lavender/30", iconText: "text-lavender-shade", border: "border-lavender/40" },
  chores: { iconBg: "bg-peach/30", iconText: "text-peach-shade", border: "border-peach/40" },
  neutral: { iconBg: "bg-clay-light", iconText: "text-clay-dark", border: "border-line" },
};

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  action?: ReactNode;
}

export default function PageHeader({ title, description, icon: Icon, action }: PageHeaderProps) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <span
            className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-clay-light text-clay-dark"
            aria-hidden="true"
          >
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div>
          <h1 className="font-display text-3xl font-bold leading-none tracking-tight text-clay sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-lg text-sm text-ink-soft sm:text-base">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
