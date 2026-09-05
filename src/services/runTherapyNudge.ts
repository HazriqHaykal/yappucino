import { getRecentCheckIns } from "./checkIn";
import {
  fetchTherapyPlaceCandidates,
  getCurrentPositionOrFallback,
  PlaceOption,
} from "./googlePlaces";
import { currentUserId } from "../store/useTaskStore";
import { useTherapyStore } from "../store/useTherapyStore";
import type { TherapySuggestion } from "../types/task";

const SYSTEM_PROMPT = `You are a caring assistant helping a university student who may be feeling stressed find real nearby professional support. Given several nearby real places (name, type — psychologists/counseling practices) and a brief note on their recent mood check-ins, choose the best 1-3 options and for each write one short, warm, non-clinical sentence on why reaching out could help. Never diagnose or give therapeutic advice yourself — you are only helping them pick where to go. If the note suggests something urgent, still just recommend real nearby places calmly; this app is not a crisis line. Respond ONLY with JSON: {"suggestions": [{"chosenPlaceName": string, "reasoning": string}]}`;

const GEMINI_MODEL = "gemini-flash-lite-latest";
const TIMEOUT_MS = 10000;
const RECENT_DAYS = 7;

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
    "[runTherapyNudge] Gemini's chosenPlaceName didn't match any real place — skipping it:",
    chosenPlaceName,
    "| available:",
    places.map((p) => p.name),
  );
  return null;
}

async function buildMoodSummary(userId: string | null): Promise<string> {
  if (!userId) return "Not signed in — no check-in history available.";

  const checkIns = await getRecentCheckIns(userId, RECENT_DAYS);
  if (checkIns.length === 0) return "No check-ins in the last 7 days.";

  const stressCount = checkIns.filter((c) => c.mood === "stress").length;
  const latestMood = checkIns[0].mood;

  return `${checkIns.length} check-in(s) in the last 7 days, ${stressCount} marked "stress". Most recent mood: ${latestMood}.`;
}

/**
 * Full therapy-nudge flow: get location (or the silent fallback), find
 * nearby psychologists/counseling practices, ask Gemini to pick 1-3 given
 * the user's recent mood check-ins, and write the resulting suggestions
 * into useTherapyStore. Returns null only if nothing usable came back at
 * all — never throws.
 */
export async function runTherapyNudge(
  userId: string | null,
): Promise<TherapySuggestion[] | null> {
  const coords = await getCurrentPositionOrFallback();

  const places = await fetchTherapyPlaceCandidates(coords);
  if (!places) {
    console.error("[runTherapyNudge] FALLBACK TRIGGERED (no places found)");
    return null;
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[runTherapyNudge] no VITE_GEMINI_API_KEY — returning null");
    return null;
  }

  const moodSummary = await buildMoodSummary(userId);

  const requestBody = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: JSON.stringify({
              places: places.map((p) => ({ name: p.name, type: p.type })),
              moodSummary,
            }),
          },
        ],
      },
    ],
    generationConfig: { responseMimeType: "application/json" },
  };

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

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "<unreadable body>");
      console.error(
        "[runTherapyNudge] FALLBACK TRIGGERED (API error):",
        response.status,
        errorBody,
      );
      return null;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") {
      console.error("[runTherapyNudge] FALLBACK TRIGGERED (no text in candidates):", data);
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (parseErr) {
      console.error("[runTherapyNudge] FALLBACK TRIGGERED (JSON.parse failed):", text, parseErr);
      return null;
    }

    const candidate = parsed as Record<string, unknown>;
    if (!Array.isArray(candidate.suggestions)) {
      console.error(
        "[runTherapyNudge] FALLBACK TRIGGERED (malformed output shape):",
        candidate,
      );
      return null;
    }

    const seenPlaceIds = new Set<string>();
    const suggestions: TherapySuggestion[] = [];

    for (const item of candidate.suggestions) {
      if (
        typeof item !== "object" ||
        item === null ||
        typeof (item as Record<string, unknown>).chosenPlaceName !== "string" ||
        typeof (item as Record<string, unknown>).reasoning !== "string"
      ) {
        console.warn("[runTherapyNudge] skipping malformed suggestion entry:", item);
        continue;
      }

      const { chosenPlaceName, reasoning } = item as {
        chosenPlaceName: string;
        reasoning: string;
      };

      const matchedPlace = matchChosenPlace(chosenPlaceName, places);
      if (!matchedPlace) continue;

      if (seenPlaceIds.has(matchedPlace.id)) {
        console.warn(
          "[runTherapyNudge] Gemini picked the same place twice — skipping duplicate:",
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
        contacted: false,
      });
    }

    if (suggestions.length === 0) {
      console.error(
        "[runTherapyNudge] FALLBACK TRIGGERED (no suggestions survived matching):",
        candidate,
      );
      return null;
    }

    useTherapyStore.getState().addSuggestions(suggestions);

    return suggestions;
  } catch (err) {
    console.error("[runTherapyNudge] FALLBACK TRIGGERED (threw):", err);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
