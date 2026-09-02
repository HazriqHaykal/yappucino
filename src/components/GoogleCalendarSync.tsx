import { useState } from "react";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { useTaskStore } from "../store/useTaskStore";
import { fetchUpcomingEvents, mapEventToTaskInput } from "../services/googleCalendar";
import { inferCalendarTaskAttributes } from "../services/inferCalendarTaskAttributes";
import type { CalendarImportInput } from "../store/useTaskStore";

/**
 * Enriches one imported event with a Gemini-inferred category, priority,
 * and load, applied automatically (no per-event confirm popup — importing
 * can pull in many events at once, so a dialog per event would be bad UX;
 * this is also why calendar imports get fuller inference than the manual
 * "Add Task" flow's lightweight category-only mismatch check — there's no
 * user around to set priority/load themselves per event).
 * Falls back to the event's existing defaults (study_work / non_urgent / 5)
 * on a malformed result, a failed call, or a timeout.
 */
async function resolveImportAttributes(
  task: CalendarImportInput,
): Promise<CalendarImportInput> {
  console.log("[GoogleCalendarSync] resolveImportAttributes: enriching", task.title);
  const inferred = await inferCalendarTaskAttributes(
    task.title,
    task.dueAt,
    task.category,
  );
  if (!inferred) {
    console.log(
      "[GoogleCalendarSync] resolveImportAttributes: using fallback defaults for",
      task.title,
      "| category:",
      task.category,
      "priority:",
      task.priority,
      "load:",
      task.load,
    );
    return task;
  }
  console.log(
    "[GoogleCalendarSync] resolveImportAttributes: applying inferred values for",
    task.title,
    "|",
    inferred,
  );
  return {
    ...task,
    category: inferred.category,
    priority: inferred.priority,
    load: inferred.load,
  };
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const CALENDAR_READONLY_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

function GoogleCalendarSyncButton() {
  const importCalendarTasks = useTaskStore((state) => state.importCalendarTasks);

  // Access token lives only in memory for this hackathon demo — no
  // localStorage, no refresh handling. Re-connecting just re-runs the flow.
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runSync = async (token: string) => {
    setIsSyncing(true);
    setError(null);
    setMessage(null);
    try {
      const events = await fetchUpcomingEvents(token);
      const mapped = events
        .map(mapEventToTaskInput)
        .filter((task): task is CalendarImportInput => task !== null);

      const enriched = await Promise.all(mapped.map(resolveImportAttributes));

      const addedCount = importCalendarTasks(enriched);
      const skippedCount = enriched.length - addedCount;

      setMessage(
        skippedCount > 0
          ? `Imported ${addedCount} new events from your calendar (${skippedCount} already synced).`
          : `Imported ${addedCount} events from your calendar.`,
      );
    } catch (err) {
      console.error("[GoogleCalendarSync] sync failed:", err);
      setError("Couldn't fetch your calendar events. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  const login = useGoogleLogin({
    scope: CALENDAR_READONLY_SCOPE,
    onSuccess: (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
      runSync(tokenResponse.access_token);
    },
    onError: () => {
      setError("Google sign-in failed or was cancelled. Please try again.");
    },
  });

  return (
    <div style={{ marginBottom: 24, padding: 16, border: "1px solid #ccc", borderRadius: 8 }}>
      <button
        type="button"
        onClick={() => login()}
        disabled={isSyncing}
        style={{ padding: "8px 16px", cursor: isSyncing ? "not-allowed" : "pointer" }}
      >
        {isSyncing
          ? "Syncing…"
          : accessToken
            ? "Re-sync Google Calendar"
            : "Connect Google Calendar"}
      </button>
      {message && <p style={{ color: "#2a2", marginTop: 8, fontSize: 13 }}>{message}</p>}
      {error && <p style={{ color: "#c33", marginTop: 8, fontSize: 13 }}>{error}</p>}
    </div>
  );
}

export default function GoogleCalendarSync() {
  if (!CLIENT_ID) {
    return (
      <div
        style={{
          marginBottom: 24,
          padding: 16,
          border: "1px solid #ccc",
          borderRadius: 8,
          color: "#888",
          fontSize: 13,
        }}
      >
        Google Calendar sync needs VITE_GOOGLE_CLIENT_ID set in .env
        (see .env.example) to show the connect button.
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <GoogleCalendarSyncButton />
    </GoogleOAuthProvider>
  );
}
