import type { TherapySuggestion } from "../types/task";

// A separate key from VITE_GOOGLE_PLACES_API_KEY — API restrictions are
// per-key, and a key locked to Places API (New) gets rejected by the embed
// iframe. See .env.example for the full explanation.
const MAPS_EMBED_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface TherapySuggestionCardProps {
  suggestion: TherapySuggestion;
  onMarkContacted: () => void;
}

export default function TherapySuggestionCard({
  suggestion,
  onMarkContacted,
}: TherapySuggestionCardProps) {
  const { placeName, placeType, reasoning, lat, lng, contacted } = suggestion;

  const embedSrc = MAPS_EMBED_API_KEY
    ? `https://www.google.com/maps/embed/v1/place?key=${MAPS_EMBED_API_KEY}&q=${encodeURIComponent(placeName)}`
    : null;
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

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

        {contacted ? (
          <span className="font-display text-xs font-medium text-clay-dark">
            Reached out ✓
          </span>
        ) : (
          <button
            type="button"
            onClick={onMarkContacted}
            className="focus-ring rounded-full bg-clay px-3 py-1 font-display text-xs font-medium text-white hover:bg-clay-dark"
          >
            I reached out
          </button>
        )}
      </div>
    </div>
  );
}
