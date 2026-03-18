"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "./helpers"
import { calendarEventSchema } from "@/lib/validations/scheduling"
import { notifyOrgMembers } from "./notifications"
import { pushEventToGoogle, deleteEventFromGoogle } from "./google-calendar"

export type EventActionState = {
  error?: string
  success?: boolean
}

function clean(val: string | undefined): string | null {
  if (!val || val === "__none__") return null
  return val
}

export async function createEvent(
  _prev: EventActionState,
  formData: FormData
): Promise<EventActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const raw = Object.fromEntries(formData)
  const parsed = calendarEventSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const data = parsed.data
  const supabase = await createClient()

  const { data: event, error } = await supabase
    .from("calendar_events")
    .insert({
      org_id: ctx.orgId,
      created_by: ctx.userId,
      title: data.title,
      description: data.description || null,
      location: data.location || null,
      start_at: data.start_at,
      end_at: data.end_at || null,
      all_day: data.all_day,
      status: data.status,
      color: clean(data.color),
      contact_id: clean(data.contact_id),
      company_id: clean(data.company_id),
      deal_id: clean(data.deal_id),
      assigned_to: clean(data.assigned_to),
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  // Log activity
  await supabase.from("activities").insert({
    org_id: ctx.orgId,
    contact_id: clean(data.contact_id),
    company_id: clean(data.company_id),
    deal_id: clean(data.deal_id),
    type: "EVENT_CREATED",
    title: `Created event "${data.title}"`,
    metadata: { event_id: event.id },
    created_by: ctx.userId,
  })

  await notifyOrgMembers({
    orgId: ctx.orgId,
    performerUserId: ctx.userId,
    category: "event",
    title: `New event: "${data.title}"`,
    link: "/calendar",
    icon: "Calendar",
    sourceType: "event",
    sourceId: event.id,
  })

  // Push to Google Calendar if connected
  await pushEventToGoogle(event.id).catch(() => {})

  revalidatePath("/calendar")
  return { success: true }
}

export async function updateEvent(
  id: string,
  _prev: EventActionState,
  formData: FormData
): Promise<EventActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const raw = Object.fromEntries(formData)
  const parsed = calendarEventSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const data = parsed.data
  const supabase = await createClient()

  const { error } = await supabase
    .from("calendar_events")
    .update({
      title: data.title,
      description: data.description || null,
      location: data.location || null,
      start_at: data.start_at,
      end_at: data.end_at || null,
      all_day: data.all_day,
      status: data.status,
      color: clean(data.color),
      contact_id: clean(data.contact_id),
      company_id: clean(data.company_id),
      deal_id: clean(data.deal_id),
      assigned_to: clean(data.assigned_to),
    })
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  // Push update to Google Calendar
  await pushEventToGoogle(id).catch(() => {})

  revalidatePath("/calendar")
  return { success: true }
}

export async function updateEventStatus(
  id: string,
  status: string
): Promise<EventActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { data: event } = await supabase
    .from("calendar_events")
    .select("title")
    .eq("id", id)
    .eq("org_id", ctx.orgId)
    .single()

  if (!event) return { error: "Event not found" }

  const { error } = await supabase
    .from("calendar_events")
    .update({ status })
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  if (status === "COMPLETED") {
    await supabase.from("activities").insert({
      org_id: ctx.orgId,
      type: "EVENT_COMPLETED",
      title: `Completed event "${event.title}"`,
      metadata: { event_id: id },
      created_by: ctx.userId,
    })

    await notifyOrgMembers({
      orgId: ctx.orgId,
      performerUserId: ctx.userId,
      category: "event",
      title: `Event completed: "${event.title}"`,
      link: "/calendar",
      icon: "Calendar",
      sourceType: "event",
      sourceId: id,
    })
  }

  revalidatePath("/calendar")
  return { success: true }
}

export async function updateEventTime(
  id: string,
  startAt: string,
  endAt: string | null
): Promise<EventActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("calendar_events")
    .update({
      start_at: startAt,
      end_at: endAt,
    })
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/calendar")
  return { success: true }
}

export async function deleteEvent(id: string): Promise<EventActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  // Check for Google event ID before deleting
  const { data: event } = await supabase
    .from("calendar_events")
    .select("google_event_id")
    .eq("id", id)
    .eq("org_id", ctx.orgId)
    .single()

  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  // Delete from Google Calendar if synced
  if (event?.google_event_id) {
    await deleteEventFromGoogle(event.google_event_id).catch(() => {})
  }

  revalidatePath("/calendar")
  return { success: true }
}
