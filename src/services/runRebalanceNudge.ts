import { useTaskStore } from "../store/useTaskStore";
import type { RebalanceNudgeResult } from "../types/task";

const SYSTEM_PROMPT = `You are a supportive companion helping a student rebalance their workload. Given a non-urgent task (title, category, load, due date, and how many times it's already been deferred), write ONE short, specific sentence explaining why THIS particular task can reasonably wait — reference something concrete about the task itself (what it is, how far off the due date is, how light the load is, or what's more pressing instead) rather than a generic reassurance. Avoid starting every response with the same phrase — vary your opening and wording each time. Do not start your sentence with "Since" — vary your sentence openings naturally (e.g. lead with the task itself, a time reference, an observation, or a direct reassurance, rotating structure each time rather than defaulting to a causal "Since X, Y" pattern). If deferCount is already 2 or more, shift tone: be honest that it's been pushed back a couple times now and gently suggest tackling it soon, rather than defaulting to 'it's okay to wait' again. Keep it conversational, like a friend who actually looked at what you're avoiding — not a template. Also optionally suggest a reasonable defer-until date (ISO string), a few days out but before the due date. Respond ONLY with JSON: {"reasoning": string, "suggestedDeferUntil": string | null}`;

const RETRY_INSTRUCTION =
  'That opening starts with "Since", which is not allowed. Rewrite it with a different sentence opening instead — lead with the task itself, a time reference, an observation, or a direct reassurance — while keeping the same meaning and the same JSON shape.';

const STARTS_WITH_SINCE = /^since\b/i;

const GEMINI_MODEL = "gemini-flash-lite-latest";
const TIMEOUT_MS = 10000;

type GeminiContent = {
  role: "user" | "model";
  parts: { text: string }[];
};

/** Single generateContent call. Returns the raw text of the first
 * candidate, or null on any failure (logs the reason either way). */
async function generateOnce(
  contents: GeminiContent[],
  apiKey: string,
  logLabel: string,
): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { responseMimeType: "application/json" },
        }),
      },
    );

    console.log(
      `[runRebalanceNudge] <<< response status for: ${logLabel} |`,
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "<unreadable body>");
      console.error(
        `[runRebalanceNudge] FALLBACK TRIGGERED (API error) for: ${logLabel} | status:`,
        response.status,
        "| body:",
        errorBody,
      );
      return null;
    }

    const data = await response.json();
    console.log(`[runRebalanceNudge] <<< raw response body for: ${logLabel} |`, data);

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") {
      console.error(
        `[runRebalanceNudge] FALLBACK TRIGGERED (no text in candidates) for: ${logLabel} | full response:`,
        data,
      );
      return null;
    }

    return text;
  } catch (err) {
    console.error(
      `[runRebalanceNudge] FALLBACK TRIGGERED (threw) for: ${logLabel} | full error object:`,
      err,
    );
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Parses and validates one response's JSON text. Returns null (and logs)
 * if it doesn't match the expected shape. */
function parseCandidate(
  text: string,
  logLabel: string,
): { reasoning: string; suggestedDeferUntilRaw: unknown } | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (parseErr) {
    console.error(
      `[runRebalanceNudge] FALLBACK TRIGGERED (JSON.parse failed) for: ${logLabel} | raw text:`,
      text,
      "| error:",
      parseErr,
    );
    return null;
  }

  const candidate = parsed as Record<string, unknown>;
  if (typeof candidate.reasoning !== "string") {
    console.error(
      `[runRebalanceNudge] FALLBACK TRIGGERED (malformed output shape) for: ${logLabel} | parsed:`,
      candidate,
    );
    return null;
  }

  return {
    reasoning: candidate.reasoning,
    suggestedDeferUntilRaw: candidate.suggestedDeferUntil,
  };
}

/**
 * Looks up the task and asks Gemini whether deferring it further makes
 * sense. Does NOT touch the store — this only returns a suggestion; the
 * caller applies it (via useTaskStore's deferTask) only once the user
 * explicitly clicks "Defer it". Returns null on any failure.
 *
 * If the first response opens with "Since" (banned by the system prompt,
 * but not always honored by the model), retries once with the prior
 * response shown back to it and an explicit correction request. If the
 * retry also fails or is itself unusable, falls back to the first valid
 * result rather than losing it.
 */
export async function runRebalanceNudge(
  taskId: string,
): Promise<RebalanceNudgeResult | null> {
  const task = useTaskStore.getState().tasks.find((t) => t.id === taskId);
  if (!task) {
    console.error("[runRebalanceNudge] no task found for id:", taskId);
    return null;
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn(
      "[runRebalanceNudge] no API key — returning null for:",
      task.title,
    );
    return null;
  }

  // A raw ISO date gives the model nothing to reason with directly — a
  // calculated day count ("due in 6 days") is what actually lets it write
  // something specific instead of generic filler.
  const daysUntilDue = task.dueAt
    ? Math.round((new Date(task.dueAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null;

  const userMessageText = JSON.stringify({
    title: task.title,
    category: task.category,
    load: task.load,
    daysUntilDue,
    dueAt: task.dueAt ?? null,
    deferCount: task.deferCount,
    now: new Date().toISOString(),
  });

  const initialContents: GeminiContent[] = [
    { role: "user", parts: [{ text: userMessageText }] },
  ];

  console.log(
    "[runRebalanceNudge] >>> calling Gemini for:",
    task.title,
    "| deferCount:",
    task.deferCount,
    "| user message:",
    userMessageText,
  );

  const firstText = await generateOnce(initialContents, apiKey, task.title);
  if (firstText === null) return null;

  const firstCandidate = parseCandidate(firstText, task.title);
  if (firstCandidate === null) return null;

  let finalCandidate = firstCandidate;

  if (STARTS_WITH_SINCE.test(firstCandidate.reasoning.trim())) {
    console.warn(
      '[runRebalanceNudge] first response opened with "Since" for:',
      task.title,
      "| retrying once:",
      firstCandidate.reasoning,
    );

    const retryContents: GeminiContent[] = [
      ...initialContents,
      { role: "model", parts: [{ text: firstText }] },
      { role: "user", parts: [{ text: RETRY_INSTRUCTION }] },
    ];

    const retryText = await generateOnce(retryContents, apiKey, `${task.title} (retry)`);
    const retryCandidate = retryText ? parseCandidate(retryText, `${task.title} (retry)`) : null;

    if (retryCandidate !== null) {
      if (STARTS_WITH_SINCE.test(retryCandidate.reasoning.trim())) {
        console.warn(
          '[runRebalanceNudge] retry STILL opened with "Since" for:',
          task.title,
          "| using it anyway (one retry only):",
          retryCandidate.reasoning,
        );
      }
      finalCandidate = retryCandidate;
    } else {
      console.warn(
        "[runRebalanceNudge] retry failed for:",
        task.title,
        "| falling back to first (non-compliant) response",
      );
    }
  }

  let suggestedDeferUntil: string | undefined;
  if (typeof finalCandidate.suggestedDeferUntilRaw === "string") {
    const parsedDate = new Date(finalCandidate.suggestedDeferUntilRaw);
    if (!Number.isNaN(parsedDate.getTime())) {
      suggestedDeferUntil = parsedDate.toISOString();
    } else {
      console.warn(
        "[runRebalanceNudge] ignoring unparsable suggestedDeferUntil for:",
        task.title,
        "|",
        finalCandidate.suggestedDeferUntilRaw,
      );
    }
  }

  const result: RebalanceNudgeResult = {
    taskId,
    reasoning: finalCandidate.reasoning,
    suggestedDeferUntil,
  };

  console.log("[runRebalanceNudge] SUCCESS for:", task.title, "|", result);
  return result;
}
