// Cyberjaya, Selangor — silent fallback when geolocation is unavailable,
// denied, or times out. Per spec, no error is ever shown to the user for
// this; it just quietly uses these coordinates instead.
const FALLBACK_COORDS = { lat: 2.9213, lng: 101.6559 };
const GEOLOCATION_TIMEOUT_MS = 8000;

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PlaceOption {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
}

export function getCurrentPositionOrFallback(): Promise<Coordinates> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn(
        "[googlePlaces] geolocation not supported — using fallback coords",
      );
      resolve(FALLBACK_COORDS);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        console.log("[googlePlaces] got real geolocation:", coords);
        resolve(coords);
      },
      (err) => {
        console.warn(
          "[googlePlaces] geolocation failed — using fallback coords:",
          err.message,
        );
        resolve(FALLBACK_COORDS);
      },
      { timeout: GEOLOCATION_TIMEOUT_MS },
    );
  });
}

const PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchNearby";
const SEARCH_RADIUS_METERS = 3000;
const RESULTS_PER_TYPE_GROUP = 4;
const PLACES_TIMEOUT_MS = 10000;

// Separate queries per type group (rather than one query with all types
// combined) so each activity type is guaranteed a shot at being
// represented, instead of letting the API's own ranking silently favor
// whichever type happens to be most common/closest nearby.
const TYPE_GROUPS: string[][] = [["cafe"], ["park"], ["tourist_attraction"]];

// "tourist_attraction" in particular surfaces temples/mosques/churches in
// many regions — excluded here since a recovery suggestion shouldn't assume
// anything about the user's religion (or lack of one).
const RELIGIOUS_PLACE_TYPES = new Set([
  "church",
  "hindu_temple",
  "mosque",
  "synagogue",
  "place_of_worship",
]);

async function searchNearbyByTypes(
  coords: Coordinates,
  apiKey: string,
  includedTypes: string[],
): Promise<PlaceOption[]> {
  const requestBody = {
    includedTypes,
    maxResultCount: RESULTS_PER_TYPE_GROUP,
    locationRestriction: {
      circle: {
        center: { latitude: coords.lat, longitude: coords.lng },
        radius: SEARCH_RADIUS_METERS,
      },
    },
  };

  console.log("[googlePlaces] >>> searchNearby request:", requestBody);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PLACES_TIMEOUT_MS);

  try {
    const response = await fetch(PLACES_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.types,places.primaryType,places.location",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    console.log(
      "[googlePlaces] <<< response status for",
      includedTypes,
      "|",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "<unreadable body>");
      console.error(
        "[googlePlaces] searchNearby failed for",
        includedTypes,
        "| key used: VITE_GOOGLE_PLACES_API_KEY (prefix",
        `${apiKey.slice(0, 6)}…)`,
        "| status:",
        response.status,
        "| body:",
        errorBody,
      );
      return [];
    }

    const data = await response.json();
    console.log("[googlePlaces] <<< raw response body for", includedTypes, "|", data);

    const rawPlaces: Record<string, unknown>[] = Array.isArray(data.places)
      ? data.places
      : [];

    return rawPlaces
      .filter((place) => {
        const types = (place.types as string[] | undefined) ?? [];
        const primaryType = place.primaryType as string | undefined;
        const isReligious =
          (primaryType && RELIGIOUS_PLACE_TYPES.has(primaryType)) ||
          types.some((t) => RELIGIOUS_PLACE_TYPES.has(t));
        if (isReligious) {
          console.log(
            "[googlePlaces] filtered out religious place:",
            (place.displayName as { text?: string } | undefined)?.text,
          );
        }
        return !isReligious;
      })
      .map((place) => {
        const displayName = place.displayName as { text?: string } | undefined;
        const location = place.location as
          | { latitude?: number; longitude?: number }
          | undefined;
        const types = place.types as string[] | undefined;

        return {
          id: place.id as string | undefined,
          name: displayName?.text ?? "Unnamed place",
          type: (place.primaryType as string) ?? types?.[0] ?? "place",
          lat: location?.latitude,
          lng: location?.longitude,
        };
      })
      .filter(
        (place): place is PlaceOption =>
          typeof place.id === "string" &&
          typeof place.lat === "number" &&
          typeof place.lng === "number",
      );
  } catch (err) {
    console.error(
      "[googlePlaces] searchNearby threw for",
      includedTypes,
      "| key used: VITE_GOOGLE_PLACES_API_KEY | error:",
      err,
    );
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Queries multiple place-type groups (cafe, park, tourist_attraction) in
 * parallel and merges the results into one deduped candidate list, aiming
 * for 6-10 total candidates so downstream ranking has real variety to work
 * with. Returns null only if every group came back empty (missing key,
 * every request failed, or genuinely nothing nearby) — a partial failure
 * in one group still returns whatever the others found.
 */
export async function fetchRecoveryPlaceCandidates(
  coords: Coordinates,
): Promise<PlaceOption[] | null> {
  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("[googlePlaces] no VITE_GOOGLE_PLACES_API_KEY configured");
    return null;
  }

  const resultsByGroup = await Promise.all(
    TYPE_GROUPS.map((types) => searchNearbyByTypes(coords, apiKey, types)),
  );

  const seenIds = new Set<string>();
  const merged: PlaceOption[] = [];
  for (const place of resultsByGroup.flat()) {
    if (seenIds.has(place.id)) continue;
    seenIds.add(place.id);
    merged.push(place);
  }

  if (merged.length === 0) {
    console.warn("[googlePlaces] no usable places found across any type group");
    return null;
  }

  console.log(`[googlePlaces] merged ${merged.length} candidate(s):`, merged);
  return merged;
}
