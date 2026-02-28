"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "./helpers"

export async function exportContactsCsv(): Promise<{ error?: string; csv?: string }> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("contacts")
    .select("first_name, last_name, email, phone, title, notes, company:companies(name)")
    .eq("org_id", ctx.orgId)
    .order("first_name")

  if (error) return { error: error.message }

  const rows = (data ?? []).map((c) => ({
    first_name: c.first_name,
    last_name: c.last_name,
    email: c.email || "",
    phone: c.phone || "",
    title: c.title || "",
    company: (c.company as unknown as { name: string } | null)?.name || "",
    notes: c.notes || "",
  }))

  const headers = ["first_name", "last_name", "email", "phone", "title", "company", "notes"]
  const csvLines = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => {
        const val = r[h as keyof typeof r]
        return val.includes(",") || val.includes('"') || val.includes("\n")
          ? `"${val.replace(/"/g, '""')}"`
          : val
      }).join(",")
    ),
  ]

  return { csv: csvLines.join("\n") }
}

export async function exportCompaniesCsv(): Promise<{ error?: string; csv?: string }> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("companies")
    .select("name, domain, industry, email, phone, address, notes")
    .eq("org_id", ctx.orgId)
    .order("name")

  if (error) return { error: error.message }

  const rows = (data ?? []).map((c) => ({
    name: c.name,
    domain: c.domain || "",
    industry: c.industry || "",
    email: c.email || "",
    phone: c.phone || "",
    address: c.address || "",
    notes: c.notes || "",
  }))

  const headers = ["name", "domain", "industry", "email", "phone", "address", "notes"]
  const csvLines = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => {
        const val = r[h as keyof typeof r]
        return val.includes(",") || val.includes('"') || val.includes("\n")
          ? `"${val.replace(/"/g, '""')}"`
          : val
      }).join(",")
    ),
  ]

  return { csv: csvLines.join("\n") }
}

export async function exportDealsCsv(): Promise<{ error?: string; csv?: string }> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("deals")
    .select("title, value, stage, priority, expected_close_date, notes, contact:contacts(first_name, last_name), company:companies(name)")
    .eq("org_id", ctx.orgId)
    .order("created_at", { ascending: false })

  if (error) return { error: error.message }

  const rows = (data ?? []).map((d) => ({
    title: d.title,
    value: d.value ? String(d.value) : "",
    stage: d.stage,
    priority: d.priority,
    expected_close_date: d.expected_close_date || "",
    contact: d.contact ? `${(d.contact as unknown as { first_name: string }).first_name} ${(d.contact as unknown as { last_name: string }).last_name}` : "",
    company: (d.company as unknown as { name: string } | null)?.name || "",
    notes: d.notes || "",
  }))

  const headers = ["title", "value", "stage", "priority", "expected_close_date", "contact", "company", "notes"]
  const csvLines = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => {
        const val = r[h as keyof typeof r]
        return val.includes(",") || val.includes('"') || val.includes("\n")
          ? `"${val.replace(/"/g, '""')}"`
          : val
      }).join(",")
    ),
  ]

  return { csv: csvLines.join("\n") }
}

export async function bulkImportContacts(
  rows: { first_name: string; last_name: string; email?: string; phone?: string; title?: string; notes?: string }[]
): Promise<{ error?: string; count?: number }> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  if (rows.length === 0) return { error: "No rows to import" }
  if (rows.length > 500) return { error: "Maximum 500 rows per import" }

  const supabase = await createClient()

  const inserts = rows.map((r) => ({
    org_id: ctx.orgId,
    first_name: r.first_name,
    last_name: r.last_name,
    email: r.email || null,
    phone: r.phone || null,
    title: r.title || null,
    notes: r.notes || null,
    created_by: ctx.userId,
  }))

  const { error } = await supabase.from("contacts").insert(inserts)
  if (error) return { error: error.message }

  revalidatePath("/dashboard/crm/contacts")
  return { count: rows.length }
}

export async function bulkImportCompanies(
  rows: { name: string; domain?: string; industry?: string; email?: string; phone?: string; address?: string; notes?: string }[]
): Promise<{ error?: string; count?: number }> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  if (rows.length === 0) return { error: "No rows to import" }
  if (rows.length > 500) return { error: "Maximum 500 rows per import" }

  const supabase = await createClient()

  const inserts = rows.map((r) => ({
    org_id: ctx.orgId,
    name: r.name,
    domain: r.domain || null,
    industry: r.industry || null,
    email: r.email || null,
    phone: r.phone || null,
    address: r.address || null,
    notes: r.notes || null,
    created_by: ctx.userId,
  }))

  const { error } = await supabase.from("companies").insert(inserts)
  if (error) return { error: error.message }

  revalidatePath("/dashboard/crm/companies")
  return { count: rows.length }
}
