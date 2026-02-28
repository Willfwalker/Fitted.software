"use server"

import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "./helpers"

export interface SearchResult {
  id: string
  type: "contact" | "company" | "deal"
  title: string
  subtitle: string | null
}

export async function globalSearch(query: string): Promise<{ results: SearchResult[]; error?: string }> {
  const ctx = await getOrgId()
  if (!ctx) return { results: [], error: "Not authenticated" }

  if (!query || query.trim().length < 2) return { results: [] }

  const supabase = await createClient()
  const q = `%${query.trim()}%`

  const [contactsRes, companiesRes, dealsRes] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, first_name, last_name, email")
      .eq("org_id", ctx.orgId)
      .or(`first_name.ilike.${q},last_name.ilike.${q},email.ilike.${q}`)
      .limit(5),
    supabase
      .from("companies")
      .select("id, name, domain")
      .eq("org_id", ctx.orgId)
      .or(`name.ilike.${q},domain.ilike.${q}`)
      .limit(5),
    supabase
      .from("deals")
      .select("id, title, value")
      .eq("org_id", ctx.orgId)
      .ilike("title", q)
      .limit(5),
  ])

  const results: SearchResult[] = [
    ...(contactsRes.data ?? []).map((c) => ({
      id: c.id,
      type: "contact" as const,
      title: `${c.first_name} ${c.last_name}`,
      subtitle: c.email,
    })),
    ...(companiesRes.data ?? []).map((c) => ({
      id: c.id,
      type: "company" as const,
      title: c.name,
      subtitle: c.domain,
    })),
    ...(dealsRes.data ?? []).map((d) => ({
      id: d.id,
      type: "deal" as const,
      title: d.title,
      subtitle: d.value ? `$${Number(d.value).toLocaleString()}` : null,
    })),
  ]

  return { results }
}
