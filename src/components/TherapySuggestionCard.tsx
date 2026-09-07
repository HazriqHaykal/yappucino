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
  const { placeName, placeType, address, phone, rating, hours, reasoning, contacted } =
    suggestion;

  const mapQuery = `${placeName}, ${address}`;
  const embedSrc = MAPS_EMBED_API_KEY
    ? `https://www.google.com/maps/embed/v1/place?key=${MAPS_EMBED_API_KEY}&q=${encodeURIComponent(mapQuery)}`
    : null;
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}`;

  return (
    <div className="w-full max-w-md rounded-2xl border border-line bg-paper-card p-3 shadow-flat">
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="font-display text-sm font-semibold text-ink">{placeName}</p>
        {rating !== undefined && (
          <span className="shrink-0 font-display text-xs font-semibold text-clay-dark">
            ★ {rating.toFixed(1)}
          </span>
        )}
      </div>
      <p className="text-xs uppercase tracking-wide text-ink-faint">{placeType}</p>
      <p className="mt-1 text-xs text-ink-faint">{address}</p>
      {(phone || hours) && (
        <p className="mt-1 text-xs text-ink-faint">
          {phone}
          {phone && hours ? " · " : ""}
          {hours}
        </p>
      )}
      <p className="mb-2 mt-2 text-sm text-ink-soft">{reasoning}</p>

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
