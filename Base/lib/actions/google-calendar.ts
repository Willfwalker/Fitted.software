"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "./helpers"
import {
  insertGoogleEvent,
  updateGoogleEvent,
  deleteGoogleEvent,
  listGoogleEvents,
} from "@/lib/google/calendar-client"
import type { Integration } from "@/lib/types/integrations"

export type GoogleCalActionState = {
  error?: string
  success?: boolean
}

/** Get the user's Google Calendar integration */
async function getGoogleIntegration(): Promise<{
  integration: Integration | null
  ctx: { orgId: string; userId: string } | null
}> {
  const ctx = await getOrgId()
  if (!ctx) return { integration: null, ctx: null }

  const supabase = await createClient()
  const { data } = await supabase
    .from("integrations")
    .select("*")
    .eq("org_id", ctx.orgId)
    .eq("user_id", ctx.userId)
    .eq("provider", "google_calendar")
    .eq("enabled", true)
    .maybeSingle()

  return { integration: data as Integration | null, ctx }
}

/** Refresh Google OAuth token if expired */
async function ensureFreshToken(integration: Integration): Promise<string | null> {
  if (!integration.access_token) return null

  // Check if token is still valid (with 5 min buffer)
  if (integration.token_expiry) {
    const expiry = new Date(integration.token_expiry).getTime()
    if (Date.now() < expiry - 300000) {
      return integration.access_token
    }
  }

  // Token expired — refresh
  if (!integration.refresh_token) return null

  try {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: integration.refresh_token,
      grant_type: "refresh_token",
    })

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    })

    if (!res.ok) return null

    const data = await res.json()
    const supabase = await createClient()

    await supabase
      .from("integrations")
      .update({
        access_token: data.access_token,
        token_expiry: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      })
      .eq("id", integration.id)

    return data.access_token as string
  } catch {
    return null
  }
}

/**
 * Push a Fitted event to Google Calendar.
 * Called after createEvent / updateEvent.
 */
export async function pushEventToGoogle(eventId: string): Promise<GoogleCalActionState> {
  const { integration, ctx } = await getGoogleIntegration()
  if (!ctx) return { error: "Not authenticated" }
  if (!integration) return { success: true } // No integration — silently skip

  const token = await ensureFreshToken(integration)
  if (!token) return { error: "Google token expired and could not be refreshed" }

  const supabase = await createClient()
  const { data: event } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("id", eventId)
    .eq("org_id", ctx.orgId)
    .single()

  if (!event) return { error: "Event not found" }

  const calendarId = (integration.config as Record<string, string>).calendar_id || "primary"

  const eventData = {
    summary: event.title,
    description: event.description,
    location: event.location,
    start: event.all_day
      ? { date: event.start_at.split("T")[0] }
      : { dateTime: event.start_at },
    end: event.all_day
      ? { date: (event.end_at || event.start_at).split("T")[0] }
      : { dateTime: event.end_at || event.start_at },
  }

  try {
    if (event.google_event_id) {
      // Update existing
      await updateGoogleEvent(token, calendarId, event.google_event_id, eventData)
    } else {
      // Create new
      const googleId = await insertGoogleEvent(token, calendarId, eventData)
      if (googleId) {
        await supabase
          .from("calendar_events")
          .update({
            google_event_id: googleId,
            google_calendar_id: calendarId,
            last_synced_at: new Date().toISOString(),
          })
          .eq("id", eventId)
          .eq("org_id", ctx.orgId)
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Google sync failed"
    return { error: message }
  }

  // Update sync timestamp
  await supabase
    .from("calendar_events")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", eventId)
    .eq("org_id", ctx.orgId)

  return { success: true }
}

/**
 * Delete event from Google Calendar.
 */
export async function deleteEventFromGoogle(
  googleEventId: string
): Promise<GoogleCalActionState> {
  const { integration } = await getGoogleIntegration()
  if (!integration) return { success: true }

  const token = await ensureFreshToken(integration)
  if (!token) return { error: "Token expired" }

  const calendarId = (integration.config as Record<string, string>).calendar_id || "primary"

  try {
    await deleteGoogleEvent(token, calendarId, googleEventId)
  } catch {
    // Silently fail — event may have been deleted from Google already
  }

  return { success: true }
}

/**
 * Pull events from Google Calendar into Fitted.
 * Used by the cron job.
 */
export async function pullEventsFromGoogle(
  userId: string,
  orgId: string
): Promise<{ imported: number; error?: string }> {
  const supabase = await createClient()

  const { data: integration } = await supabase
    .from("integrations")
    .select("*")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .eq("provider", "google_calendar")
    .eq("enabled", true)
    .maybeSingle()

  if (!integration) return { imported: 0 }

  const token = await ensureFreshToken(integration as Integration)
  if (!token) return { imported: 0, error: "Token expired" }

  const calendarId = (integration.config as Record<string, string>).calendar_id || "primary"

  // Sync last 7 days + next 30 days
  const timeMin = new Date(Date.now() - 7 * 86400000).toISOString()
  const timeMax = new Date(Date.now() + 30 * 86400000).toISOString()

  const googleEvents = await listGoogleEvents(token, calendarId, timeMin, timeMax)

  let imported = 0

  for (const ge of googleEvents) {
    if (ge.status === "cancelled") continue

    // Check if already synced
    const { data: existing } = await supabase
      .from("calendar_events")
      .select("id, last_synced_at")
      .eq("google_event_id", ge.id)
      .eq("org_id", orgId)
      .maybeSingle()

    const startAt = ge.start.dateTime || ge.start.date || ""
    const endAt = ge.end.dateTime || ge.end.date || null
    const allDay = !ge.start.dateTime

    if (existing) {
      // Last-write-wins: update if Google's is newer
      const googleUpdated = new Date(ge.updated).getTime()
      const localSynced = existing.last_synced_at ? new Date(existing.last_synced_at).getTime() : 0

      if (googleUpdated > localSynced) {
        await supabase
          .from("calendar_events")
          .update({
            title: ge.summary || "Untitled",
            description: ge.description || null,
            location: ge.location || null,
            start_at: startAt,
            end_at: endAt,
            all_day: allDay,
            last_synced_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
      }
    } else {
      // Import new event
      await supabase
        .from("calendar_events")
        .insert({
          org_id: orgId,
          title: ge.summary || "Untitled",
          description: ge.description || null,
          location: ge.location || null,
          start_at: startAt,
          end_at: endAt,
          all_day: allDay,
          status: "SCHEDULED",
          google_event_id: ge.id,
          google_calendar_id: calendarId,
          last_synced_at: new Date().toISOString(),
          created_by: userId,
        })
      imported++
    }
  }

  return { imported }
}

/** Disconnect Google Calendar integration */
export async function disconnectGoogleCalendar(): Promise<GoogleCalActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("integrations")
    .delete()
    .eq("org_id", ctx.orgId)
    .eq("user_id", ctx.userId)
    .eq("provider", "google_calendar")

  if (error) return { error: error.message }

  revalidatePath("/settings")
  return { success: true }
}
