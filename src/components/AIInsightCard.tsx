import type { ReactNode } from "react";
import { SparkleIcon } from "./icons";

interface AIInsightCardProps {
  insight: ReactNode;
  action?: ReactNode;
  className?: string;
}

// The app's one recurring "AI is quietly working" pattern — a small labeled
// card, never a chat bubble. Used on the Room dashboard and the Tasks page
// so the AI reads as one consistent presence across the app.
export default function AIInsightCard({ insight, action, className = "" }: AIInsightCardProps) {
  return (
    <div
      className={`rounded-2xl border border-clay-light bg-clay-light/25 p-4 ${className}`}
    >
      <div className="flex items-center gap-1.5 text-clay-dark">
        <SparkleIcon className="h-4 w-4" />
        <span className="font-display text-xs font-bold uppercase tracking-wide">AI insight</span>
      </div>
      <p className="mt-1.5 text-sm leading-snug text-ink">{insight}</p>
      {action && (
        <div className="mt-2.5 border-t border-clay-light pt-2.5">
          <div className="flex items-center gap-1.5 text-clay-dark">
            <span className="font-display text-[0.65rem] font-bold uppercase tracking-wide">
              Suggested action
            </span>
          </div>
          <p className="mt-1 text-sm leading-snug text-ink-soft">{action}</p>
        </div>
      )}
    </div>
  );
}
