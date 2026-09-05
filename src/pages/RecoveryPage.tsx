import { useEffect, useState } from "react";
import { runRecoveryNudge } from "../services/runRecoveryNudge";
import RecoverySuggestionCard from "../components/RecoverySuggestionCard";
import { useRecoveryStore } from "../store/useRecoveryStore";

export default function RecoveryPage() {
  const recoverySuggestions = useRecoveryStore((state) => state.suggestions);
  const completeRecoverySuggestion = useRecoveryStore(
    (state) => state.completeRecoverySuggestion,
  );

  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestionIds, setSuggestionIds] = useState<string[]>([]);

  // Auto-triggers the same runRecoveryNudge() flow that used to sit behind
  // a button click — now it just fires as soon as this page mounts, i.e.
  // whenever the user navigates to this tab.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsFetching(true);
      setError(null);
      const result = await runRecoveryNudge();
      if (cancelled) return;
      setIsFetching(false);
      if (result) {
        setSuggestionIds(result.map((s) => s.id));
      } else {
        setError("Couldn't find a suggestion right now, try again later.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const suggestions = suggestionIds
    .map((id) => recoverySuggestions.find((s) => s.id === id))
    .filter((s): s is (typeof recoverySuggestions)[number] => s !== undefined);

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center px-5 py-10 sm:px-8">
      <h2 className="mb-6 self-start font-display text-lg font-semibold text-ink">
        Suggest Recovery
      </h2>

      {isFetching && <p className="text-sm text-ink-soft">Finding a spot for you…</p>}

      {!isFetching && error && <p className="text-sm text-clay-dark">{error}</p>}

      {!isFetching && suggestions.length > 0 && (
        <div className="flex w-full flex-wrap justify-center gap-4">
          {suggestions.map((suggestion) => (
            <RecoverySuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onComplete={() => completeRecoverySuggestion(suggestion.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
