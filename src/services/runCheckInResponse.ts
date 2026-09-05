import type { Mood } from "../types/checkIn";

const SYSTEM_PROMPT = `You are a close, attentive friend (a virtual buddy character) responding to a student's daily check-in — not a wellness app sending a generic notification. Given their selected mood and an optional note about what's on their mind, write a genuine 2-3 sentence response that actually engages with what they said, not a single comfort platitude.

Rules:
- If they gave a note, reflect back something specific from it so they feel actually heard — don't just acknowledge "you have a lot going on," name the real thing.
- Avoid empty filler phrases like "be gentle with yourself," "take a deep breath," or "one step at a time" as your go-to response — earn the comfort by being specific first.
- If they're struggling or tired, go beyond comfort: acknowledge the real weight of what they described, and where it fits naturally, offer one small, concrete thought or suggestion — not just reassurance.
- If they're doing well, genuinely engage with what's making them feel that way instead of generic cheering.
- If there's no note, it's fine to be shorter and simpler, but still specific to their mood rather than a stock line.
- Sound like a real person who was actually listening, not a therapist's script.
- Only reference details actually present in their note — never invent backstory, history, or context they didn't give you (e.g. don't assume how long they've been looking forward to something, who else is involved, or anything not stated).

Respond ONLY with JSON: {"message": string}`;

const GEMINI_MODEL = "gemini-flash-lite-latest";
const TIMEOUT_MS = 10000;

/**
 * Asks Gemini for a short, mood-specific reply to a daily check-in.
 * Returns null on any failure (missing key, network error, timeout,
 * malformed response) so the caller can fall back to a neutral message
 * rather than showing nothing.
 */
export async function runCheckInResponse(
  mood: Mood,
  note: string,
): Promise<string | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[runCheckInResponse] no VITE_GEMINI_API_KEY — returning null");
    return null;
  }

  const requestBody = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      {
        role: "user",
        parts: [
          { text: JSON.stringify({ mood, note: note.trim() || null }) },
        ],
      },
    ],
    generationConfig: { responseMimeType: "application/json" },
  };

  console.log(
    "[runCheckInResponse] >>> calling Gemini | mood:",
    mood,
    "| note:",
    note,
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
      "[runCheckInResponse] <<< response status:",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "<unreadable body>");
      console.error(
        "[runCheckInResponse] FALLBACK TRIGGERED (API error):",
        response.status,
        errorBody,
      );
      return null;
    }

    const data = await response.json();
    console.log("[runCheckInResponse] <<< raw response body:", data);

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") {
      console.error(
        "[runCheckInResponse] FALLBACK TRIGGERED (no text in candidates):",
        data,
      );
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (parseErr) {
      console.error(
        "[runCheckInResponse] FALLBACK TRIGGERED (JSON.parse failed):",
        text,
        parseErr,
      );
      return null;
    }

    const candidate = parsed as Record<string, unknown>;
    if (
      typeof candidate.message !== "string" ||
      candidate.message.trim().length === 0
    ) {
      console.error(
        "[runCheckInResponse] FALLBACK TRIGGERED (malformed output shape):",
        candidate,
      );
      return null;
    }

    console.log("[runCheckInResponse] SUCCESS:", candidate.message);
    return candidate.message;
  } catch (err) {
    console.error("[runCheckInResponse] FALLBACK TRIGGERED (threw):", err);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
