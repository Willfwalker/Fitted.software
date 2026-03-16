"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "./helpers"
import { requirePermission } from "@/lib/rbac/require"
import { contactSchema } from "@/lib/validations/crm"
import { notifyOrgMembers } from "./notifications"

export type ContactActionState = {
  error?: string
  success?: boolean
}

export async function createContact(
  _prev: ContactActionState,
  formData: FormData
): Promise<ContactActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  // Extract metadata.* keys from FormData
  const metadata: Record<string, unknown> = {}
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("metadata.")) {
      metadata[key.replace("metadata.", "")] = value
    }
  }

  const raw = { ...Object.fromEntries(formData), metadata }
  const parsed = contactSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const data = parsed.data
  const supabase = await createClient()

  const { error } = await supabase.from("contacts").insert({
    org_id: ctx.orgId,
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email || null,
    phone: data.phone || null,
    title: data.title || null,
    company_id: data.company_id || null,
    notes: data.notes || null,
    metadata: Object.keys(metadata).length > 0 ? metadata : null,
    created_by: ctx.userId,
  })

  if (error) return { error: error.message }

  // Log activity
  await supabase.from("activities").insert({
    org_id: ctx.orgId,
    type: "CONTACT_CREATED",
    title: `Created contact ${data.first_name} ${data.last_name}`,
    created_by: ctx.userId,
  })

  await notifyOrgMembers({
    orgId: ctx.orgId,
    performerUserId: ctx.userId,
    category: "contact",
    title: `New contact: ${data.first_name} ${data.last_name}`,
    link: "/crm/contacts",
    icon: "User",
    sourceType: "contact",
  })

  revalidatePath("/crm/contacts")
  return { success: true }
}

export async function updateContact(
  id: string,
  _prev: ContactActionState,
  formData: FormData
): Promise<ContactActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  // Extract metadata.* keys from FormData
  const metadata: Record<string, unknown> = {}
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("metadata.")) {
      metadata[key.replace("metadata.", "")] = value
    }
  }

  const raw = { ...Object.fromEntries(formData), metadata }
  const parsed = contactSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const data = parsed.data
  const supabase = await createClient()

  const { error } = await supabase
    .from("contacts")
    .update({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email || null,
      phone: data.phone || null,
      title: data.title || null,
      company_id: data.company_id || null,
      notes: data.notes || null,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
    })
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/crm/contacts")
  revalidatePath(`/crm/contacts/${id}`)
  return { success: true }
}

export async function deleteContact(id: string): Promise<ContactActionState> {
  let permResult
  try {
    permResult = await requirePermission("records:delete")
  } catch {
    return { error: "Insufficient permissions" }
  }
  const { supabase, ctx } = permResult

  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/crm/contacts")
  return { success: true }
}

export async function bulkDeleteContacts(ids: string[]): Promise<ContactActionState> {
  if (ids.length === 0) return { error: "No contacts selected" }

  let permResult
  try {
    permResult = await requirePermission("records:delete")
  } catch {
    return { error: "Insufficient permissions" }
  }
  const { supabase, ctx } = permResult

  const { error } = await supabase
    .from("contacts")
    .delete()
    .in("id", ids)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/crm/contacts")
  return { success: true }
}
