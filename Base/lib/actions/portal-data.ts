"use server"

import { createClient } from "@supabase/supabase-js"
import type { ClientPortal, PortalPermissions } from "@/lib/types/portal"

// Admin client for portal data — no user context (public access via token)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/** Validates a portal token and returns the portal with org info */
export async function getPortalByToken(token: string): Promise<{
  portal: ClientPortal | null
  orgName: string | null
  error?: string
}> {
  const supabase = getAdminClient()

  const { data: portal, error } = await supabase
    .from("client_portals")
    .select("*, contact:contacts(id, first_name, last_name, email), company:companies(id, name)")
    .eq("token", token)
    .eq("enabled", true)
    .maybeSingle()

  if (error || !portal) return { portal: null, orgName: null, error: "Portal not found" }

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", portal.org_id)
    .single()

  return { portal: portal as ClientPortal, orgName: org?.name || "Company" }
}

export async function getPortalInvoices(
  token: string
): Promise<{ data: unknown[]; error?: string }> {
  const { portal, error } = await getPortalByToken(token)
  if (!portal || error) return { data: [], error }

  const perms = portal.permissions as PortalPermissions
  if (!perms.invoices) return { data: [], error: "Access denied" }

  const supabase = getAdminClient()

  let query = supabase
    .from("invoices")
    .select("id, invoice_number, status, total, currency, issue_date, due_date, paid_at, share_token, payment_url")
    .eq("org_id", portal.org_id)
    .in("status", ["SENT", "PAID", "OVERDUE"])
    .order("issue_date", { ascending: false })

  if (portal.contact_id) query = query.eq("contact_id", portal.contact_id)
  if (portal.company_id) query = query.eq("company_id", portal.company_id)

  const { data, error: fetchError } = await query
  if (fetchError) return { data: [], error: fetchError.message }

  return { data: data ?? [] }
}

export async function getPortalProjects(
  token: string
): Promise<{ data: unknown[]; error?: string }> {
  const { portal, error } = await getPortalByToken(token)
  if (!portal || error) return { data: [], error }

  const perms = portal.permissions as PortalPermissions
  if (!perms.projects) return { data: [], error: "Access denied" }

  const supabase = getAdminClient()

  // Fetch tasks linked to the portal's contact/company
  let query = supabase
    .from("tasks")
    .select("id, title, status, priority, due_date, column:board_columns(id, name)")
    .eq("org_id", portal.org_id)
    .order("created_at", { ascending: false })

  if (portal.contact_id) query = query.eq("contact_id", portal.contact_id)
  if (portal.company_id) query = query.eq("company_id", portal.company_id)

  const { data, error: fetchError } = await query
  if (fetchError) return { data: [], error: fetchError.message }

  return { data: data ?? [] }
}

export async function getPortalFiles(
  token: string
): Promise<{ data: unknown[]; error?: string }> {
  const { portal, error } = await getPortalByToken(token)
  if (!portal || error) return { data: [], error }

  const perms = portal.permissions as PortalPermissions
  if (!perms.files) return { data: [], error: "Access denied" }

  const supabase = getAdminClient()

  // Get files linked to the contact/company via entity_files
  const entityType = portal.contact_id ? "contact" : "company"
  const entityId = portal.contact_id || portal.company_id

  const { data: entityFiles } = await supabase
    .from("entity_files")
    .select("file:files(id, name, original_name, mime_type, size, storage_path, created_at)")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId!)

  const files = (entityFiles ?? [])
    .map((ef) => ef.file)
    .filter(Boolean)

  return { data: files }
}

export async function getPortalForms(
  token: string
): Promise<{ data: unknown[]; error?: string }> {
  const { portal, error } = await getPortalByToken(token)
  if (!portal || error) return { data: [], error }

  const perms = portal.permissions as PortalPermissions
  if (!perms.forms) return { data: [], error: "Access denied" }

  const supabase = getAdminClient()

  // Get form submissions linked to the contact/company
  let query = supabase
    .from("form_submissions")
    .select("id, data, submitted_at, form:forms(id, name)")
    .eq("org_id", portal.org_id)
    .order("submitted_at", { ascending: false })

  if (portal.contact_id) query = query.eq("contact_id", portal.contact_id)
  if (portal.company_id) query = query.eq("company_id", portal.company_id)

  const { data, error: fetchError } = await query
  if (fetchError) return { data: [], error: fetchError.message }

  return { data: data ?? [] }
}
