import type { Category, Task } from "../types/task";

export interface CalendarTaskInference {
  category: Category;
  priority: Task["priority"];
  load: number;
}

const VALID_CATEGORIES: Category[] = ["study_work", "health", "people", "chores"];
const VALID_PRIORITIES: Task["priority"][] = ["urgent", "non_urgent"];

const SYSTEM_PROMPT = `You are a task classifier for a student workload app. Given a task title, category options, and due date, return your best judgment. Categories: study_work (assignments, exams, deadlines, work), health (sleep, exercise, medical), people (social, family, hangouts, birthdays, group work), chores (errands, laundry, bills, life admin). Infer priority as urgent if the due date is within 2 days OR the title implies high stakes (exam, submission, deadline). Infer load 1-10 based on how heavy the task sounds: major deadlines/exams = 7-9, moderate tasks = 4-6, casual/social/low-effort = 1-3. Respond ONLY with JSON, no other text: {"category": "study_work"|"health"|"people"|"chores", "priority": "urgent"|"non_urgent", "load": number}`;

// gemini-3.6-flash does mandatory hidden "thinking" before answering, which
// took anywhere from ~2s to 23s+ in testing for this simple classification
// task — that's what was blowing through the old 15s timeout and silently
// falling back to defaults on every call. gemini-flash-lite-latest has no
// such overhead and returned correct results in under 1.1s across all
// tested cases, so it's the right model for a task this simple.
const GEMINI_MODEL = "gemini-flash-lite-latest";
const TIMEOUT_MS = 10000;

/**
 * Returns null on any failure (missing key, network error, timeout,
 * malformed response) so the caller can fall back to the task's existing
 * defaults without blocking the import.
 */
export async function inferCalendarTaskAttributes(
  title: string,
  dueAt: string | undefined,
  defaultCategory: Category,
): Promise<CalendarTaskInference | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn(
      "[inferCalendarTaskAttributes] FALLBACK TRIGGERED (no API key) for:",
      title,
    );
    return null;
  }

  // The system prompt's "urgent if due within 2 days" rule needs a
  // reference point for "now" — the model has no reliable way to know
  // today's real date on its own, so it's included here even though it's
  // not part of the literal user-message spec (title + due date only).
  // Without it the urgency inference would be a guess, not a comparison.
  const userMessage = {
    title,
    dueDate: dueAt ?? null,
    now: new Date().toISOString(),
  };

  const requestBody = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      {
        role: "user",
        parts: [{ text: JSON.stringify(userMessage) }],
      },
    ],
    generationConfig: { responseMimeType: "application/json" },
  };

  console.log(
    "[inferCalendarTaskAttributes] >>> calling Gemini for:",
    title,
    "| current default category:",
    defaultCategory,
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
      "[inferCalendarTaskAttributes] <<< response status for:",
      title,
      "|",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "<unreadable body>");
      console.error(
        "[inferCalendarTaskAttributes] FALLBACK TRIGGERED (API error) for:",
        title,
        "| status:",
        response.status,
        "| body:",
        errorBody,
      );
      return null;
    }

    const data = await response.json();
    console.log(
      "[inferCalendarTaskAttributes] <<< raw response body for:",
      title,
      "|",
      data,
    );

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") {
      console.error(
        "[inferCalendarTaskAttributes] FALLBACK TRIGGERED (no text in candidates) for:",
        title,
        "| full response:",
        data,
      );
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (parseErr) {
      console.error(
        "[inferCalendarTaskAttributes] FALLBACK TRIGGERED (JSON.parse failed) for:",
        title,
        "| raw text:",
        text,
        "| error:",
        parseErr,
      );
      return null;
    }

    const candidate = parsed as Record<string, unknown>;

    if (
      !VALID_CATEGORIES.includes(candidate.category as Category) ||
      !VALID_PRIORITIES.includes(candidate.priority as Task["priority"]) ||
      typeof candidate.load !== "number" ||
      !Number.isFinite(candidate.load)
    ) {
      console.error(
        "[inferCalendarTaskAttributes] FALLBACK TRIGGERED (malformed output shape) for:",
        title,
        "| parsed:",
        candidate,
      );
      return null;
    }

    const result: CalendarTaskInference = {
      category: candidate.category as Category,
      priority: candidate.priority as Task["priority"],
      load: Math.min(10, Math.max(1, Math.round(candidate.load as number))),
    };

    console.log(
      "[inferCalendarTaskAttributes] SUCCESS for:",
      title,
      "| inferred:",
      result,
    );

    return result;
  } catch (err) {
    console.error(
      "[inferCalendarTaskAttributes] FALLBACK TRIGGERED (threw) for:",
      title,
      "| full error object:",
      err,
    );
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
