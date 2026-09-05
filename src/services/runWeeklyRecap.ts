import { getRecentCheckIns } from "./checkIn";
import { useTaskStore } from "../store/useTaskStore";

const SYSTEM_PROMPT = `You are a warm, encouraging companion writing a short weekly recap for a university student using a workload-balance app. You'll receive their current tasks (title, category, priority, load, status) and their daily check-ins from the past week (mood, an optional note, and when). Write a short, warm paragraph (3-5 sentences, conversational not clinical) reflecting on their week — mention any pattern in mood if the check-ins show one, which category seems to be taking the most energy right now, and end on an encouraging note. If there's too little data to say much, keep it brief and inviting rather than padding it out. Respond ONLY with JSON: {"summary": string}`;

// Same lesson as the other Gemini calls in this codebase: gemini-3.6-flash's
// mandatory hidden "thinking" makes it unpredictably slow for tasks this
// simple. gemini-flash-lite-latest answers fast and reliably.
const GEMINI_MODEL = "gemini-flash-lite-latest";
const TIMEOUT_MS = 10000;
const RECENT_DAYS = 7;

export interface WeeklyRecapResult {
  summary: string;
}

const EMPTY_RESULT: WeeklyRecapResult = {
  summary:
    "Not much tracked yet this week — add a few tasks or check in with your buddy, and this'll have more to say.",
};

const FAILURE_RESULT: WeeklyRecapResult = {
  summary: "Couldn't put together your recap right now — try again in a bit.",
};

/**
 * Pulls current tasks from the store and (if signed in) recent check-ins
 * from Firestore, sends both to Gemini, and returns a short recap. Never
 * throws — any failure resolves to FAILURE_RESULT.
 */
export async function runWeeklyRecap(
  userId: string | null,
): Promise<WeeklyRecapResult> {
  const tasks = useTaskStore.getState().tasks;
  const checkIns = userId ? await getRecentCheckIns(userId, RECENT_DAYS) : [];

  if (tasks.length === 0 && checkIns.length === 0) {
    return EMPTY_RESULT;
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[runWeeklyRecap] no API key — returning failure fallback");
    return FAILURE_RESULT;
  }

  const taskPayload = tasks.map((task) => ({
    title: task.title,
    category: task.category,
    priority: task.priority,
    load: task.load,
    status: task.status,
  }));

  const checkInPayload = checkIns.map((checkIn) => ({
    mood: checkIn.mood,
    note: checkIn.note || null,
    createdAt: checkIn.createdAt,
  }));

  const requestBody = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: JSON.stringify({
              tasks: taskPayload,
              checkIns: checkInPayload,
              now: new Date().toISOString(),
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
        "[runWeeklyRecap] FALLBACK TRIGGERED (API error):",
        response.status,
        errorBody,
      );
      return FAILURE_RESULT;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") {
      console.error("[runWeeklyRecap] FALLBACK TRIGGERED (no text in candidates):", data);
      return FAILURE_RESULT;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (parseErr) {
      console.error("[runWeeklyRecap] FALLBACK TRIGGERED (JSON.parse failed):", text, parseErr);
      return FAILURE_RESULT;
    }

    const candidate = parsed as Record<string, unknown>;
    if (typeof candidate.summary !== "string") {
      console.error("[runWeeklyRecap] FALLBACK TRIGGERED (malformed output shape):", candidate);
      return FAILURE_RESULT;
    }

    return { summary: candidate.summary };
  } catch (err) {
    console.error("[runWeeklyRecap] FALLBACK TRIGGERED (threw):", err);
    return FAILURE_RESULT;
  } finally {
    clearTimeout(timeoutId);
  }
}
