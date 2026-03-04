"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "./helpers"
import { createNotificationSchema } from "@/lib/validations/notifications"

export type NotificationActionState = {
  error?: string
  success?: boolean
}

/**
 * Create a notification. Called internally by other server actions — NOT a form action.
 * Does NOT require the calling user to be the target user.
 */
export async function createNotification(params: {
  userId: string
  orgId: string
  title: string
  body?: string
  link?: string
  icon?: string
  sourceType?: string
  sourceId?: string
}): Promise<NotificationActionState> {
  const parsed = createNotificationSchema.safeParse(params)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const data = parsed.data
  const supabase = await createClient()

  const { error } = await supabase.from("notifications").insert({
    org_id: data.orgId,
    user_id: data.userId,
    title: data.title,
    body: data.body || null,
    link: data.link || null,
    icon: data.icon || null,
    source_type: data.sourceType || null,
    source_id: data.sourceId || null,
  })

  if (error) return { error: error.message }

  return { success: true }
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(id: string): Promise<NotificationActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("notifications")
    .update({ status: "READ" })
    .eq("id", id)
    .eq("user_id", ctx.userId)

  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  return { success: true }
}

/**
 * Mark all notifications as read for the current user.
 */
export async function markAllAsRead(): Promise<NotificationActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("notifications")
    .update({ status: "READ" })
    .eq("user_id", ctx.userId)
    .eq("status", "UNREAD")

  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  return { success: true }
}

/**
 * Get the unread notification count for the current user.
 */
export async function getUnreadCount(): Promise<number> {
  const ctx = await getOrgId()
  if (!ctx) return 0

  const supabase = await createClient()

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", ctx.userId)
    .eq("status", "UNREAD")

  if (error) return 0

  return count ?? 0
}

/**
 * Get paginated notifications for the current user.
 */
export async function getNotifications(
  limit: number = 20,
  offset: number = 0
): Promise<{ data: import("@/lib/types/notifications").Notification[]; error?: string }> {
  const ctx = await getOrgId()
  if (!ctx) return { data: [], error: "Not authenticated" }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return { data: [], error: error.message }

  return { data: data ?? [] }
}
