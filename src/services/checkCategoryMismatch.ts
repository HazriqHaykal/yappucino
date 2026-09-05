import type { Category } from "../types/task";

export interface CategoryCheckResult {
  likelyMismatch: boolean;
  suggestedCategory: Category | null;
  confirmMessage: string;
}

const VALID_CATEGORIES: Category[] = [
  "study_work",
  "health",
  "people",
  "chores",
];

// PLACEHOLDER — the actual system prompt wasn't included in the request that
// asked for this feature ("[paste the Gemini prompt above]" came through
// literally). Swap this out for the real one; the only hard requirement is
// that it keeps instructing strict JSON output matching CategoryCheckResult.
const SYSTEM_PROMPT = `You are a task-categorization checker for a productivity app called Pace.
The only valid categories are: study_work, health, people, chores.

You will receive a JSON object with the task's "title" and the "category" the
user selected. Decide whether the title strongly suggests a different
category would fit better.

Respond with ONLY strict JSON, no markdown, matching exactly this shape:
{
  "likelyMismatch": boolean,
  "suggestedCategory": "study_work" | "health" | "people" | "chores" | null,
  "confirmMessage": string
}

Rules:
- Only set "likelyMismatch" to true when you are fairly confident the
  selected category is wrong.
- When "likelyMismatch" is true, "suggestedCategory" must be one of the four
  valid categories (never the same as the selected one) and "confirmMessage"
  must be a short, friendly, one-sentence explanation aimed at the end user.
- When "likelyMismatch" is false, set "suggestedCategory" to null and
  "confirmMessage" to an empty string.`;

// See the same constant in inferCalendarTaskAttributes.ts — gemini-3.6-flash's
// mandatory hidden "thinking" made this take anywhere from ~2s to 23s+ for a
// simple classification, regularly blowing through any reasonable timeout.
// gemini-flash-lite-latest returns correct results in under 1.1s.
const GEMINI_MODEL = "gemini-flash-lite-latest";
const TIMEOUT_MS = 10000;

/**
 * Returns null on any failure (missing key, network error, timeout,
 * malformed response) so the caller can fall back to adding the task
 * without a mismatch check, per the schema notes' "strict system prompt +
 * JSON parsing with a try/catch fallback" guidance.
 */
export async function checkCategoryMismatch(
  title: string,
  category: Category,
): Promise<CategoryCheckResult | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  console.log(
    "[checkCategoryMismatch] apiKey present:",
    Boolean(apiKey),
    apiKey ? `prefix="${apiKey.slice(0, 6)}…" length=${apiKey.length}` : "",
  );
  if (!apiKey) {
    console.log("[checkCategoryMismatch] no API key — skipping check, returning null");
    return null;
  }

  const requestBody = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      {
        role: "user",
        parts: [{ text: JSON.stringify({ title, category }) }],
      },
    ],
    generationConfig: { responseMimeType: "application/json" },
  };
  console.log("[checkCategoryMismatch] request payload:", requestBody);

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
      "[checkCategoryMismatch] response status:",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "<unreadable body>");
      console.error(
        "[checkCategoryMismatch] API call failed:",
        response.status,
        errorBody,
      );
      return null;
    }

    const data = await response.json();
    console.log("[checkCategoryMismatch] raw response body:", data);

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") {
      console.error(
        "[checkCategoryMismatch] no text found in response candidates:",
        data,
      );
      return null;
    }

    const parsed = JSON.parse(text);
    console.log("[checkCategoryMismatch] parsed model output:", parsed);

    if (typeof parsed.likelyMismatch !== "boolean") {
      console.error(
        "[checkCategoryMismatch] malformed output — missing likelyMismatch boolean:",
        parsed,
      );
      return null;
    }

    const suggestedCategory = VALID_CATEGORIES.includes(
      parsed.suggestedCategory,
    )
      ? (parsed.suggestedCategory as Category)
      : null;

    const result = {
      likelyMismatch: parsed.likelyMismatch,
      suggestedCategory,
      confirmMessage:
        typeof parsed.confirmMessage === "string" ? parsed.confirmMessage : "",
    };
    console.log("[checkCategoryMismatch] final result:", result);
    return result;
  } catch (err) {
    console.error("[checkCategoryMismatch] threw an error:", err);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
