import {
  fetchRecoveryPlaceCandidates,
  getCurrentPositionOrFallback,
  PlaceOption,
} from "./googlePlaces";
import { currentUserId, useTaskStore } from "../store/useTaskStore";
import { useRecoveryStore } from "../store/useRecoveryStore";
import type { RecoverySuggestion } from "../types/task";

const SYSTEM_PROMPT = `You are a supportive companion suggesting recovery break options for a stressed student. Given several nearby real places (name, type) and a brief note on their current workload, choose the best 2-3 DIFFERENT options that give a mix of activity types (e.g. don't pick 3 cafes — vary between something calm/seated like a cafe, something active like a park or walk, etc). For each chosen place, write one short, warm sentence explaining why it fits right now. Respond ONLY with JSON: {"suggestions": [{"chosenPlaceName": string, "reasoning": string}]}`;

const GEMINI_MODEL = "gemini-flash-lite-latest";
const TIMEOUT_MS = 10000;

function buildTaskLoadSummary(): string {
  const activeTasks = useTaskStore.getState().tasks.filter((t) => t.status === "active");
  if (activeTasks.length === 0) return "No active tasks right now.";

  const urgentCount = activeTasks.filter((t) => t.priority === "urgent").length;
  const averageLoad =
    activeTasks.reduce((sum, t) => sum + t.load, 0) / activeTasks.length;

  return `${activeTasks.length} active tasks, ${urgentCount} of them urgent, average load ${averageLoad.toFixed(1)}/10.`;
}

/** Matches Gemini's chosen name back to the real place it came from. Skips
 * (returns null) if the model returns a name that doesn't match anything,
 * rather than fabricating coordinates. */
function matchChosenPlace(
  chosenPlaceName: string,
  places: PlaceOption[],
): PlaceOption | null {
  const exact = places.find((p) => p.name === chosenPlaceName);
  if (exact) return exact;

  const looseMatch = places.find(
    (p) => p.name.trim().toLowerCase() === chosenPlaceName.trim().toLowerCase(),
  );
  if (looseMatch) return looseMatch;

  console.warn(
    "[runRecoveryNudge] Gemini's chosenPlaceName didn't match any real place — skipping it:",
    chosenPlaceName,
    "| available:",
    places.map((p) => p.name),
  );
  return null;
}

/**
 * Full recovery-nudge flow: get location (or the silent fallback), find
 * nearby recovery-friendly places across a few activity types, ask Gemini
 * to pick 2-3 varied options, and write the resulting suggestions into
 * useRecoveryStore. Returns null only if nothing usable came back at all;
 * if Gemini (or the matching step) only produces 1 usable suggestion,
 * that's returned rather than treated as a failure.
 */
export async function runRecoveryNudge(): Promise<RecoverySuggestion[] | null> {
  const coords = await getCurrentPositionOrFallback();

  const places = await fetchRecoveryPlaceCandidates(coords);
  if (!places) {
    console.error("[runRecoveryNudge] FALLBACK TRIGGERED (no places found)");
    return null;
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[runRecoveryNudge] no VITE_GEMINI_API_KEY — returning null");
    return null;
  }

  const taskLoadSummary = buildTaskLoadSummary();

  const requestBody = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: JSON.stringify({
              places: places.map((p) => ({ name: p.name, type: p.type })),
              taskLoadSummary,
            }),
          },
        ],
      },
    ],
    generationConfig: { responseMimeType: "application/json" },
  };

  console.log(
    "[runRecoveryNudge] >>> calling Gemini | candidate count:",
    places.length,
    "| request payload:",
    requestBody,
  );

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(requestBody),
      },
    );

    console.log(
      "[runRecoveryNudge] <<< response status:",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "<unreadable body>");
      console.error(
        "[runRecoveryNudge] FALLBACK TRIGGERED (API error):",
        response.status,
        errorBody,
      );
      return null;
    }

    const data = await response.json();
    console.log("[runRecoveryNudge] <<< raw response body:", data);

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") {
      console.error(
        "[runRecoveryNudge] FALLBACK TRIGGERED (no text in candidates):",
        data,
      );
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (parseErr) {
      console.error(
        "[runRecoveryNudge] FALLBACK TRIGGERED (JSON.parse failed):",
        text,
        parseErr,
      );
      return null;
    }

    const candidate = parsed as Record<string, unknown>;

    if (!Array.isArray(candidate.suggestions)) {
      console.error(
        "[runRecoveryNudge] FALLBACK TRIGGERED (malformed output shape):",
        candidate,
      );
      return null;
    }

    const seenPlaceIds = new Set<string>();
    const suggestions: RecoverySuggestion[] = [];

    for (const item of candidate.suggestions) {
      if (
        typeof item !== "object" ||
        item === null ||
        typeof (item as Record<string, unknown>).chosenPlaceName !== "string" ||
        typeof (item as Record<string, unknown>).reasoning !== "string"
      ) {
        console.warn("[runRecoveryNudge] skipping malformed suggestion entry:", item);
        continue;
      }

      const { chosenPlaceName, reasoning } = item as {
        chosenPlaceName: string;
        reasoning: string;
      };

      const matchedPlace = matchChosenPlace(chosenPlaceName, places);
      if (!matchedPlace) continue;

      // Gemini shouldn't repeat a place across its own suggestions, but
      // guard against it anyway rather than showing the same card twice.
      if (seenPlaceIds.has(matchedPlace.id)) {
        console.warn(
          "[runRecoveryNudge] Gemini picked the same place twice — skipping duplicate:",
          matchedPlace.name,
        );
        continue;
      }
      seenPlaceIds.add(matchedPlace.id);

      suggestions.push({
        id: crypto.randomUUID(),
        userId: currentUserId(),
        placeName: matchedPlace.name,
        placeType: matchedPlace.type,
        lat: matchedPlace.lat,
        lng: matchedPlace.lng,
        reasoning,
        completed: false,
      });
    }

    if (suggestions.length === 0) {
      console.error(
        "[runRecoveryNudge] FALLBACK TRIGGERED (no suggestions survived matching):",
        candidate,
      );
      return null;
    }

    console.log(
      "[runRecoveryNudge] SUCCESS —",
      suggestions.length,
      "suggestion(s):",
      suggestions,
    );

    useRecoveryStore.getState().addSuggestions(suggestions);

    return suggestions;
  } catch (err) {
    console.error("[runRecoveryNudge] FALLBACK TRIGGERED (threw):", err);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
