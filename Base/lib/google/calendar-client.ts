import { google } from "googleapis"
import type { GoogleCalendarEvent } from "@/lib/types/google-calendar"

/**
 * Creates an authenticated Google Calendar API client.
 */
export function getCalendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  auth.setCredentials({ access_token: accessToken })

  return google.calendar({ version: "v3", auth })
}

/**
 * Insert a new event into Google Calendar.
 */
export async function insertGoogleEvent(
  accessToken: string,
  calendarId: string,
  event: {
    summary: string
    description?: string | null
    location?: string | null
    start: { dateTime: string } | { date: string }
    end: { dateTime: string } | { date: string }
  }
): Promise<string | null> {
  const calendar = getCalendarClient(accessToken)

  const res = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: event.summary,
      description: event.description || undefined,
      location: event.location || undefined,
      start: event.start,
      end: event.end,
    },
  })

  return res.data.id || null
}

/**
 * Update an existing Google Calendar event.
 */
export async function updateGoogleEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: {
    summary?: string
    description?: string | null
    location?: string | null
    start?: { dateTime: string } | { date: string }
    end?: { dateTime: string } | { date: string }
  }
): Promise<void> {
  const calendar = getCalendarClient(accessToken)

  await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: {
      summary: event.summary,
      description: event.description || undefined,
      location: event.location || undefined,
      start: event.start,
      end: event.end,
    },
  })
}

/**
 * Delete an event from Google Calendar.
 */
export async function deleteGoogleEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const calendar = getCalendarClient(accessToken)

  await calendar.events.delete({
    calendarId,
    eventId,
  })
}

/**
 * List events from Google Calendar within a time range.
 */
export async function listGoogleEvents(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string
): Promise<GoogleCalendarEvent[]> {
  const calendar = getCalendarClient(accessToken)

  const res = await calendar.events.list({
    calendarId,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  })

  return (res.data.items || []) as unknown as GoogleCalendarEvent[]
}
