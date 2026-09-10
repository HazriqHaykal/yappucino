import { useEffect, useState } from "react";
import { fetchUpcomingEvents, mapEventToTaskInput } from "../services/googleCalendar";
import { signInWithGoogle } from "../services/googleAuth";
import { inferCalendarTaskAttributes } from "../services/inferCalendarTaskAttributes";
import { useAuthStore } from "../store/useAuthStore";
import { useTaskStore } from "../store/useTaskStore";
import type { CalendarImportInput } from "../store/useTaskStore";
import { CalendarIcon, CheckCircleIcon } from "./icons";

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

// Calendar access now comes from the same OAuth consent as GoogleSignIn
// (one combined sign-in flow instead of a separate connect step) — this
// component just uses whatever access token that produced. Styled to match
// the "University sync" banner right above it on the Tasks page: same
// bordered-card layout, a pill button that flips to a success badge once
// connected.
export default function GoogleCalendarSync() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isSigningIn = useAuthStore((state) => state.isSigningIn);
  const authError = useAuthStore((state) => state.error);
  const importCalendarTasks = useTaskStore((state) => state.importCalendarTasks);

  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runSync = async () => {
    if (!accessToken) return;
    setIsSyncing(true);
    setError(null);
    setMessage(null);
    try {
      const events = await fetchUpcomingEvents(accessToken);
      const mapped = events
        .map(mapEventToTaskInput)
        .filter((task): task is CalendarImportInput => task !== null);

      const enriched = await Promise.all(mapped.map(resolveImportAttributes));

      const addedCount = importCalendarTasks(enriched);
      const skippedCount = enriched.length - addedCount;

      setMessage(
        skippedCount > 0
          ? `Imported ${addedCount} new events (${skippedCount} already synced).`
          : `Imported ${addedCount} events from your calendar.`,
      );
    } catch (err) {
      console.error("[GoogleCalendarSync] sync failed:", err);
      setError("Couldn't fetch your calendar events. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync once right after sign-in, so the user doesn't have to find
  // and click the button themselves. accessToken only changes on an actual
  // sign-in/sign-out (see useAuthStore), so this fires exactly once per
  // session rather than on every re-render.
  useEffect(() => {
    if (accessToken) {
      runSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  return (
    <div className="rounded-2xl border border-line bg-paper-card p-4 shadow-flat sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-mint/30 text-mint-shade">
            <CalendarIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-sm font-semibold text-ink">Google Calendar sync</p>
            <p className="mt-0.5 max-w-md text-sm text-ink-soft">
              Connect your Google Calendar to automatically import events, deadlines and class
              schedules as tasks.
            </p>
          </div>
        </div>

        {accessToken ? (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-mint/25 px-3.5 py-1.5 font-display text-xs font-semibold text-mint-shade">
            <CheckCircleIcon className="h-4 w-4" />
            Connected
          </span>
        ) : (
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={isSigningIn}
            className="focus-ring shrink-0 rounded-full bg-clay px-4 py-2 font-display text-xs font-semibold text-white transition-colors hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
          >
            {isSigningIn ? "Connecting…" : "Connect"}
          </button>
        )}
      </div>

      {accessToken && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line-soft pt-3">
          <button
            type="button"
            onClick={runSync}
            disabled={isSyncing}
            className="focus-ring rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink-soft transition-colors hover:border-clay hover:text-clay-dark disabled:opacity-50"
          >
            {isSyncing ? "Syncing…" : "Sync now"}
          </button>
          {message && <p className="text-xs text-mint-shade">{message}</p>}
          {error && <p className="text-xs text-clay-dark">{error}</p>}
        </div>
      )}

      {!accessToken && authError && <p className="mt-2 text-xs text-clay-dark">{authError}</p>}
    </div>
  );
}
