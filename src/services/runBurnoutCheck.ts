import { useTaskStore } from "../store/useTaskStore";
import type { BurnoutCheckResult, Category } from "../types/task";

const VALID_CATEGORIES: Category[] = ["study_work", "health", "people", "chores"];

const SYSTEM_PROMPT = `You are a supportive companion helping a university student understand their workload. You'll receive a list of their active tasks (title, category, priority, load 1-10, due date). Analyze the overall picture and decide: (1) which single category, if any, seems most overloaded right now — consider total load, number of urgent tasks, and how close due dates are, not just task count; (2) write a short, warm, conversational sentence (like a caring friend, not a report) explaining why, e.g. 'Your desk's been piling up — looks like 3 deadlines this week with barely any breathing room.' If nothing seems overloaded, reasoning should be reassuring, e.g. 'Things look pretty balanced right now — nice.'; (3) split the active urgent tasks and active non-urgent tasks into two ID lists for downstream nudges. Respond ONLY with JSON: {"overloadedCategory": "study_work"|"health"|"people"|"chores"|null, "reasoning": string, "urgentTaskIds": string[], "nonUrgentTaskIds": string[]}`;

// Same lesson as checkCategoryMismatch.ts / inferCalendarTaskAttributes.ts:
// gemini-3.6-flash's mandatory hidden "thinking" makes it unpredictably slow
// (up to 23s+ in testing) for tasks this simple. gemini-flash-lite-latest
// answers in under ~1.5s.
const GEMINI_MODEL = "gemini-flash-lite-latest";
const TIMEOUT_MS = 10000;

const EMPTY_RESULT: BurnoutCheckResult = {
  overloadedCategory: null,
  reasoning: "Nothing on your plate right now — enjoy the calm.",
  urgentTaskIds: [],
  nonUrgentTaskIds: [],
};

const FAILURE_RESULT: BurnoutCheckResult = {
  overloadedCategory: null,
  reasoning: "Couldn't check in right now, try again in a bit.",
  urgentTaskIds: [],
  nonUrgentTaskIds: [],
};

/**
 * Pulls active tasks straight from the store, sends them to Gemini in one
 * call, and returns a BurnoutCheckResult. Never throws — any failure
 * (missing key, network error, timeout, malformed response) resolves to
 * FAILURE_RESULT so the UI always has something sensible to show.
 */
export async function runBurnoutCheck(): Promise<BurnoutCheckResult> {
  const activeTasks = useTaskStore
    .getState()
    .tasks.filter((task) => task.status === "active");

  console.log("[runBurnoutCheck] active task count:", activeTasks.length);

  if (activeTasks.length === 0) {
    console.log("[runBurnoutCheck] no active tasks — skipping API call");
    return EMPTY_RESULT;
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[runBurnoutCheck] no API key — returning failure fallback");
    return FAILURE_RESULT;
  }

  const taskPayload = activeTasks.map((task) => ({
    id: task.id,
    title: task.title,
    category: task.category,
    priority: task.priority,
    load: task.load,
    dueAt: task.dueAt ?? null,
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
              now: new Date().toISOString(),
            }),
          },
        ],
      },
    ],
    generationConfig: { responseMimeType: "application/json" },
  };

  console.log("[runBurnoutCheck] >>> calling Gemini | request payload:", requestBody);

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
      "[runBurnoutCheck] <<< response status:",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "<unreadable body>");
      console.error(
        "[runBurnoutCheck] FALLBACK TRIGGERED (API error):",
        response.status,
        errorBody,
      );
      return FAILURE_RESULT;
    }

    const data = await response.json();
    console.log("[runBurnoutCheck] <<< raw response body:", data);

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") {
      console.error(
        "[runBurnoutCheck] FALLBACK TRIGGERED (no text in candidates):",
        data,
      );
      return FAILURE_RESULT;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (parseErr) {
      console.error(
        "[runBurnoutCheck] FALLBACK TRIGGERED (JSON.parse failed):",
        text,
        parseErr,
      );
      return FAILURE_RESULT;
    }

    const candidate = parsed as Record<string, unknown>;

    const rawOverloaded = candidate.overloadedCategory;
    const overloadedCategoryValid =
      rawOverloaded === null || VALID_CATEGORIES.includes(rawOverloaded as Category);

    if (
      !overloadedCategoryValid ||
      typeof candidate.reasoning !== "string" ||
      !Array.isArray(candidate.urgentTaskIds) ||
      !Array.isArray(candidate.nonUrgentTaskIds)
    ) {
      console.error(
        "[runBurnoutCheck] FALLBACK TRIGGERED (malformed output shape):",
        candidate,
      );
      return FAILURE_RESULT;
    }

    // Only trust IDs that actually exist among the tasks we sent, in case
    // the model hallucinates one.
    const validIds = new Set(activeTasks.map((task) => task.id));
    const urgentTaskIds = (candidate.urgentTaskIds as unknown[]).filter(
      (id): id is string => typeof id === "string" && validIds.has(id),
    );
    const nonUrgentTaskIds = (candidate.nonUrgentTaskIds as unknown[]).filter(
      (id): id is string => typeof id === "string" && validIds.has(id),
    );

    const result: BurnoutCheckResult = {
      overloadedCategory: rawOverloaded as Category | null,
      reasoning: candidate.reasoning,
      urgentTaskIds,
      nonUrgentTaskIds,
    };

    console.log("[runBurnoutCheck] SUCCESS:", result);
    return result;
  } catch (err) {
    console.error("[runBurnoutCheck] FALLBACK TRIGGERED (threw):", err);
    return FAILURE_RESULT;
  } finally {
    clearTimeout(timeoutId);
  }
}
