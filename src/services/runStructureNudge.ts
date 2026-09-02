import { useTaskStore } from "../store/useTaskStore";
import type { StructureNudgeResult, SubStep } from "../types/task";

const SYSTEM_PROMPT = `You are a supportive companion helping a stressed student break down an urgent task into manageable steps. Given a task title, category, load (1-10), and due date, generate 3-5 concrete, actionable sub-steps that break the task into smaller pieces. Keep each step short (under 10 words) and specific — not vague advice. Also write one short, warm sentence explaining why breaking it down helps right now. Respond ONLY with JSON: {"subSteps": [{"text": string}], "reasoning": string}`;

// Same lesson as the other Gemini calls in this codebase: gemini-3.6-flash's
// mandatory hidden "thinking" makes it unpredictably slow (up to 23s+ in
// testing) for tasks this simple. gemini-flash-lite-latest is fast and
// reliable for this.
const GEMINI_MODEL = "gemini-flash-lite-latest";
const TIMEOUT_MS = 10000;

/**
 * Looks up the task, sends it to Gemini, and on success writes the
 * generated sub-steps into the store. Returns null on any failure (missing
 * task, missing key, network error, timeout, malformed response) WITHOUT
 * touching the store, so the caller can show a fallback message.
 */
export async function runStructureNudge(
  taskId: string,
): Promise<StructureNudgeResult | null> {
  const task = useTaskStore.getState().tasks.find((t) => t.id === taskId);
  if (!task) {
    console.error("[runStructureNudge] no task found for id:", taskId);
    return null;
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn(
      "[runStructureNudge] no API key — returning null for:",
      task.title,
    );
    return null;
  }

  const requestBody = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: JSON.stringify({
              title: task.title,
              category: task.category,
              load: task.load,
              dueAt: task.dueAt ?? null,
            }),
          },
        ],
      },
    ],
    generationConfig: { responseMimeType: "application/json" },
  };

  console.log(
    "[runStructureNudge] >>> calling Gemini for:",
    task.title,
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
      "[runStructureNudge] <<< response status for:",
      task.title,
      "|",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "<unreadable body>");
      console.error(
        "[runStructureNudge] FALLBACK TRIGGERED (API error) for:",
        task.title,
        "| status:",
        response.status,
        "| body:",
        errorBody,
      );
      return null;
    }

    const data = await response.json();
    console.log(
      "[runStructureNudge] <<< raw response body for:",
      task.title,
      "|",
      data,
    );

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") {
      console.error(
        "[runStructureNudge] FALLBACK TRIGGERED (no text in candidates) for:",
        task.title,
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
        "[runStructureNudge] FALLBACK TRIGGERED (JSON.parse failed) for:",
        task.title,
        "| raw text:",
        text,
        "| error:",
        parseErr,
      );
      return null;
    }

    const candidate = parsed as Record<string, unknown>;

    if (
      !Array.isArray(candidate.subSteps) ||
      typeof candidate.reasoning !== "string"
    ) {
      console.error(
        "[runStructureNudge] FALLBACK TRIGGERED (malformed output shape) for:",
        task.title,
        "| parsed:",
        candidate,
      );
      return null;
    }

    const subSteps: SubStep[] = candidate.subSteps
      .filter(
        (step): step is { text: unknown } =>
          typeof step === "object" && step !== null && "text" in step,
      )
      .map((step) => ({
        id: crypto.randomUUID(),
        text: String(step.text).trim(),
        done: false,
      }))
      .filter((step) => step.text.length > 0);

    if (subSteps.length === 0) {
      console.error(
        "[runStructureNudge] FALLBACK TRIGGERED (no usable sub-steps after filtering) for:",
        task.title,
        "| parsed:",
        candidate,
      );
      return null;
    }

    const result: StructureNudgeResult = {
      taskId,
      subSteps,
      reasoning: candidate.reasoning,
    };

    console.log("[runStructureNudge] SUCCESS for:", task.title, "|", result);

    useTaskStore.getState().setTaskSubSteps(taskId, subSteps);

    return result;
  } catch (err) {
    console.error(
      "[runStructureNudge] FALLBACK TRIGGERED (threw) for:",
      task.title,
      "| full error object:",
      err,
    );
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
