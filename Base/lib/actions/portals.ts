"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "./helpers"
import { clientPortalSchema } from "@/lib/validations/portal"
import type { ClientPortal, PortalPermissions } from "@/lib/types/portal"

export type PortalActionState = {
  error?: string
  success?: boolean
  portalId?: string
  token?: string
}

export async function createClientPortal(
  data: {
    contact_id?: string
    company_id?: string
    permissions?: PortalPermissions
  }
): Promise<PortalActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const parsed = clientPortalSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const d = parsed.data
  if (!d.contact_id && !d.company_id) return { error: "Either contact or company is required" }

  const supabase = await createClient()

  // Check for existing portal for this contact/company
  let existingQuery = supabase
    .from("client_portals")
    .select("id, token")
    .eq("org_id", ctx.orgId)

  if (d.contact_id) existingQuery = existingQuery.eq("contact_id", d.contact_id)
  if (d.company_id) existingQuery = existingQuery.eq("company_id", d.company_id)

  const { data: existing } = await existingQuery.limit(1).maybeSingle()
  if (existing) return { error: "A portal already exists for this contact/company", portalId: existing.id, token: existing.token }

  const { data: portal, error } = await supabase
    .from("client_portals")
    .insert({
      org_id: ctx.orgId,
      contact_id: d.contact_id || null,
      company_id: d.company_id || null,
      permissions: d.permissions,
      created_by: ctx.userId,
    })
    .select("id, token")
    .single()

  if (error) return { error: error.message }

  revalidatePath("/crm")
  return { success: true, portalId: portal.id, token: portal.token }
}

export async function updateClientPortal(
  id: string,
  data: { enabled?: boolean; permissions?: PortalPermissions }
): Promise<PortalActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const update: Record<string, unknown> = {}
  if (data.enabled !== undefined) update.enabled = data.enabled
  if (data.permissions) update.permissions = data.permissions

  const { error } = await supabase
    .from("client_portals")
    .update(update)
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/crm")
  return { success: true }
}

export async function deleteClientPortal(id: string): Promise<PortalActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("client_portals")
    .delete()
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/crm")
  return { success: true }
}

export async function regeneratePortalToken(id: string): Promise<PortalActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()
  const newToken = crypto.randomUUID()

  const { error } = await supabase
    .from("client_portals")
    .update({ token: newToken })
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/crm")
  return { success: true, token: newToken }
}

export async function getPortalForEntity(
  entityType: "contact" | "company",
  entityId: string
): Promise<{ data: ClientPortal | null; error?: string }> {
  const ctx = await getOrgId()
  if (!ctx) return { data: null, error: "Not authenticated" }

  const supabase = await createClient()

  const column = entityType === "contact" ? "contact_id" : "company_id"
  const { data, error } = await supabase
    .from("client_portals")
    .select("*")
    .eq("org_id", ctx.orgId)
    .eq(column, entityId)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data: data as ClientPortal | null }
}
