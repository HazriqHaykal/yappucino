import type { CalendarImportInput } from "../store/useTaskStore";

const CALENDAR_EVENTS_URL =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const SYNC_WINDOW_DAYS = 14;

interface GoogleCalendarEvent {
  id?: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
}

export async function fetchUpcomingEvents(
  accessToken: string,
): Promise<GoogleCalendarEvent[]> {
  const now = new Date();
  const rangeEnd = new Date(
    now.getTime() + SYNC_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );

  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: rangeEnd.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "50",
  });

  const response = await fetch(`${CALENDAR_EVENTS_URL}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "<unreadable body>");
    throw new Error(
      `Calendar API request failed (${response.status}): ${errorBody}`,
    );
  }

  const data = await response.json();
  return Array.isArray(data.items) ? data.items : [];
}

/** Maps a Google Calendar event to our Task shape. Returns null for events
 * we can't sensibly import (no title, no id to dedupe against). */
export function mapEventToTaskInput(
  event: GoogleCalendarEvent,
): CalendarImportInput | null {
  const title = event.summary?.trim();
  if (!event.id || !title) return null;

  const rawStart = event.start?.dateTime ?? event.start?.date;

  return {
    title,
    category: "study_work",
    priority: "non_urgent",
    load: 5,
    dueAt: rawStart ? new Date(rawStart).toISOString() : undefined,
    externalId: event.id,
  };
}
