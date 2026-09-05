import type { RecoverySuggestion } from "../types/task";

// A separate key from VITE_GOOGLE_PLACES_API_KEY — API restrictions are
// per-key, and a key locked to Places API (New) gets rejected by the embed
// iframe. See .env.example for the full explanation.
const MAPS_EMBED_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface RecoverySuggestionCardProps {
  suggestion: RecoverySuggestion;
  onComplete: () => void;
}

export default function RecoverySuggestionCard({
  suggestion,
  onComplete,
}: RecoverySuggestionCardProps) {
  const { placeName, placeType, reasoning, lat, lng, completed } = suggestion;

  const embedSrc = MAPS_EMBED_API_KEY
    ? `https://www.google.com/maps/embed/v1/place?key=${MAPS_EMBED_API_KEY}&q=${encodeURIComponent(placeName)}`
    : null;
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  // The embed iframe's own auth failures render inside its (cross-origin)
  // document — this app has no way to detect that failure via JS. Logging
  // which key/URL was used at render time is the most that's debuggable
  // from here; if the map shows Google's "not authorized" message, this is
  // what to check first.
  if (embedSrc && MAPS_EMBED_API_KEY) {
    console.log(
      "[RecoverySuggestionCard] rendering map for",
      `"${placeName}"`,
      "| key used: VITE_GOOGLE_MAPS_API_KEY (prefix",
      `${MAPS_EMBED_API_KEY.slice(0, 6)}…)`,
      "| src:",
      embedSrc,
    );
  } else {
    console.warn(
      "[RecoverySuggestionCard] no VITE_GOOGLE_MAPS_API_KEY configured — skipping map for",
      `"${placeName}"`,
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-line bg-paper-card p-3 shadow-flat">
      <p className="font-display text-sm font-semibold text-ink">{placeName}</p>
      <p className="mb-2 text-xs uppercase tracking-wide text-ink-faint">{placeType}</p>
      <p className="mb-2 text-sm text-ink-soft">{reasoning}</p>

      {embedSrc ? (
        <iframe
          title={`Map of ${placeName}`}
          src={embedSrc}
          width="100%"
          height="140"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="mb-2 rounded-lg"
        />
      ) : (
        <p className="mb-2 text-xs text-ink-faint">
          Map preview needs VITE_GOOGLE_MAPS_API_KEY.
        </p>
      )}

      <div className="flex items-center justify-between">
        <a
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring rounded-full border border-line px-3 py-1 font-display text-xs font-medium text-ink-soft hover:bg-line-soft"
        >
          Get Directions
        </a>

        {completed ? (
          <span className="font-display text-xs font-medium text-clay-dark">
            Completed ✓
          </span>
        ) : (
          <button
            type="button"
            onClick={onComplete}
            className="focus-ring rounded-full bg-clay px-3 py-1 font-display text-xs font-medium text-white hover:bg-clay-dark"
          >
            Mark as done
          </button>
        )}
      </div>
    </div>
  );
}
