"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "./helpers"
import { requirePermission } from "@/lib/rbac/require"
import { companySchema } from "@/lib/validations/crm"
import { notifyOrgMembers } from "./notifications"

export type CompanyActionState = {
  error?: string
  success?: boolean
}

export async function createCompany(
  _prev: CompanyActionState,
  formData: FormData
): Promise<CompanyActionState> {
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
  const parsed = companySchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const data = parsed.data
  const supabase = await createClient()

  const { error } = await supabase.from("companies").insert({
    org_id: ctx.orgId,
    name: data.name,
    domain: data.domain || null,
    industry: data.industry || null,
    phone: data.phone || null,
    email: data.email || null,
    address: data.address || null,
    notes: data.notes || null,
    metadata: Object.keys(metadata).length > 0 ? metadata : null,
    created_by: ctx.userId,
  })

  if (error) return { error: error.message }

  // Log activity
  await supabase.from("activities").insert({
    org_id: ctx.orgId,
    type: "COMPANY_CREATED",
    title: `Created company ${data.name}`,
    created_by: ctx.userId,
  })

  await notifyOrgMembers({
    orgId: ctx.orgId,
    performerUserId: ctx.userId,
    category: "contact",
    title: `New company: ${data.name}`,
    link: "/crm/companies",
    icon: "Building2",
    sourceType: "company",
  })

  revalidatePath("/crm/companies")
  return { success: true }
}

export async function updateCompany(
  id: string,
  _prev: CompanyActionState,
  formData: FormData
): Promise<CompanyActionState> {
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
  const parsed = companySchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const data = parsed.data
  const supabase = await createClient()

  const { error } = await supabase
    .from("companies")
    .update({
      name: data.name,
      domain: data.domain || null,
      industry: data.industry || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      notes: data.notes || null,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
    })
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/crm/companies")
  revalidatePath(`/crm/companies/${id}`)
  return { success: true }
}

export async function deleteCompany(id: string): Promise<CompanyActionState> {
  let permResult
  try {
    permResult = await requirePermission("records:delete")
  } catch {
    return { error: "Insufficient permissions" }
  }
  const { supabase, ctx } = permResult

  const { error } = await supabase
    .from("companies")
    .delete()
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/crm/companies")
  return { success: true }
}

export async function bulkDeleteCompanies(ids: string[]): Promise<CompanyActionState> {
  if (ids.length === 0) return { error: "No companies selected" }

  let permResult
  try {
    permResult = await requirePermission("records:delete")
  } catch {
    return { error: "Insufficient permissions" }
  }
  const { supabase, ctx } = permResult

  const { error } = await supabase
    .from("companies")
    .delete()
    .in("id", ids)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/crm/companies")
  return { success: true }
}
