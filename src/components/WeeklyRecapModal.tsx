import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { runWeeklyRecap } from "../services/runWeeklyRecap";
import { useAuthStore } from "../store/useAuthStore";

interface WeeklyRecapModalProps {
  onClose: () => void;
}

export default function WeeklyRecapModal({ onClose }: WeeklyRecapModalProps) {
  const user = useAuthStore((state) => state.user);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    runWeeklyRecap(user?.id ?? null).then((result) => {
      if (cancelled) return;
      setSummary(result.summary);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const today = new Date();
  const weekday = today.toLocaleDateString(undefined, { weekday: "long" });
  const month = today.toLocaleDateString(undefined, { month: "long" });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, rotate: -2, y: 10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, rotate: -2, y: 10 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="w-full max-w-sm overflow-hidden rounded-3xl border border-line bg-paper-card shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-clay px-6 pb-3 pt-4 text-center">
          <button
            type="button"
            onClick={onClose}
            className="focus-ring absolute right-3 top-3 rounded-full p-1 text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
          <p className="font-display text-xs font-bold uppercase tracking-[0.24em] text-white/80">
            {month}
          </p>
          <p className="font-display text-sm font-semibold text-white/90">{weekday}</p>
        </div>

        <div className="flex flex-col items-center gap-1 border-b border-dashed border-line px-6 py-4">
          <span className="font-display text-5xl font-bold text-ink">{today.getDate()}</span>
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Weekly recap
          </span>
        </div>

        <div className="px-6 py-5">
          {isLoading ? (
            <p className="text-sm text-ink-faint">Putting your week together…</p>
          ) : (
            <p className="text-sm leading-relaxed text-ink">{summary}</p>
          )}
          {!user && !isLoading && (
            <p className="mt-3 text-xs text-ink-faint">
              Sign in with Google to include your check-in history here too.
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
