import { useEffect, useState } from "react";
import { getRecentCheckIns } from "../services/checkIn";
import { runTherapyNudge } from "../services/runTherapyNudge";
import { useAuthStore } from "../store/useAuthStore";
import { useTherapyStore } from "../store/useTherapyStore";
import PageHeader from "../components/PageHeader";
import TherapySuggestionCard from "../components/TherapySuggestionCard";

const RECENT_DAYS = 7;
const STRESS_COUNT_THRESHOLD = 2;

export default function TherapyPage() {
  const user = useAuthStore((state) => state.user);
  const therapySuggestions = useTherapyStore((state) => state.suggestions);
  const markTherapySuggestionContacted = useTherapyStore(
    (state) => state.markTherapySuggestionContacted,
  );

  const [stressDetected, setStressDetected] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestionIds, setSuggestionIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setStressDetected(false);
      return;
    }

    (async () => {
      const checkIns = await getRecentCheckIns(user.id, RECENT_DAYS);
      if (cancelled) return;
      const stressCount = checkIns.filter((c) => c.mood === "stress").length;
      const latestIsStressed = checkIns[0]?.mood === "stress";
      setStressDetected(latestIsStressed || stressCount >= STRESS_COUNT_THRESHOLD);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleFindSupport = async () => {
    setIsFetching(true);
    setHasSearched(true);
    setError(null);
    const result = await runTherapyNudge(user?.id ?? null);
    setIsFetching(false);
    if (result) {
      setSuggestionIds(result.map((s) => s.id));
    } else {
      setError("Couldn't find anything nearby right now — try again later.");
    }
  };

  const suggestions = suggestionIds
    .map((id) => therapySuggestions.find((s) => s.id === id))
    .filter((s): s is (typeof therapySuggestions)[number] => s !== undefined);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
      <PageHeader
        title="Therapy"
        description="A calm, private space to find support — no pressure, no judgment."
      />

      <div className="mb-5 rounded-2xl border border-line bg-paper-card p-5 text-center shadow-flat sm:p-6">
        <p className="text-sm text-ink sm:text-base">
          {stressDetected
            ? "Your recent check-ins suggest a stressful stretch — talking to someone nearby might help."
            : "Feeling overwhelmed? Find a counselor or wellness professional near you."}
        </p>

        <button
          type="button"
          onClick={handleFindSupport}
          disabled={isFetching}
          className={`focus-ring mt-4 rounded-full px-6 py-3 font-display text-sm font-semibold transition-colors ${
            isFetching
              ? "cursor-not-allowed bg-line text-ink-faint"
              : "bg-clay text-white hover:bg-clay-dark"
          }`}
        >
          {isFetching ? "Finding nearby support…" : "Talk to someone — find nearby support"}
        </button>
      </div>

      <div className="mb-8 rounded-2xl border border-red-shade/30 bg-red-light/20 p-4 text-sm text-ink-soft sm:p-5">
        <p className="font-display text-xs font-bold uppercase tracking-wide text-red-shade">
          If you're in crisis
        </p>
        <p className="mt-1.5">
          This page only helps you find nearby professionals to talk to. If you're in immediate
          danger or crisis, please contact your local emergency number or a crisis helpline right
          away — you don't have to wait for a match here.
        </p>
      </div>

      {!isFetching && hasSearched && error && (
        <p className="mb-4 text-sm text-clay-dark">{error}</p>
      )}

      {!isFetching && suggestions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-4">
          {suggestions.map((suggestion) => (
            <TherapySuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onMarkContacted={() => markTherapySuggestionContacted(suggestion.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
