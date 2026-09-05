import { useEffect, useState } from "react";
import { getRecentCheckIns } from "../services/checkIn";
import { runTherapyNudge } from "../services/runTherapyNudge";
import TherapySuggestionCard from "../components/TherapySuggestionCard";
import { useAuthStore } from "../store/useAuthStore";
import { useTherapyStore } from "../store/useTherapyStore";

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
    <div className="mx-auto flex max-w-5xl flex-col items-center px-5 py-10 sm:px-8">
      <h2 className="mb-2 self-start font-display text-lg font-semibold text-ink">Therapy</h2>

      <div className="mb-6 w-full rounded-2xl border border-line bg-paper-card p-4 text-center">
        <p className="text-sm text-ink">
          {stressDetected
            ? "Your recent check-ins suggest a stressful stretch — talking to someone nearby might help."
            : "Feeling overwhelmed? Find a counselor or wellness professional near you."}
        </p>
        <p className="mt-2 text-xs text-ink-faint">
          If you're in crisis, please contact a local emergency service or crisis line —
          this only helps you find nearby professionals to talk to.
        </p>
      </div>

      <button
        type="button"
        onClick={handleFindSupport}
        disabled={isFetching}
        className={`focus-ring mb-6 rounded-full px-6 py-3 font-display text-sm font-semibold transition-colors ${
          isFetching
            ? "cursor-not-allowed bg-line text-ink-faint"
            : "bg-clay text-white hover:bg-clay-dark"
        }`}
      >
        {isFetching ? "Finding nearby support…" : "Find nearby support"}
      </button>

      {!isFetching && hasSearched && error && (
        <p className="text-sm text-clay-dark">{error}</p>
      )}

      {!isFetching && suggestions.length > 0 && (
        <div className="flex w-full flex-wrap justify-center gap-4">
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
