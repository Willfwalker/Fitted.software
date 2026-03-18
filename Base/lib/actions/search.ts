"use server"

import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "./helpers"

export interface SearchResult {
  id: string
  type: "contact" | "company" | "deal" | "task" | "file" | "event" | "message" | "template" | "form" | "time_entry"
  title: string
  subtitle: string | null
}

export async function globalSearch(query: string): Promise<{ results: SearchResult[]; error?: string }> {
  const ctx = await getOrgId()
  if (!ctx) return { results: [], error: "Not authenticated" }

  if (!query || query.trim().length < 2) return { results: [] }

  const supabase = await createClient()
  const q = `%${query.trim()}%`

  const [contactsRes, companiesRes, dealsRes, tasksRes, filesRes, eventsRes, messagesRes, templatesRes, formsRes, timeEntriesRes] = await Promise.all([
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
    supabase
      .from("tasks")
      .select("id, title, board_id")
      .eq("org_id", ctx.orgId)
      .ilike("title", q)
      .limit(5),
    supabase
      .from("files")
      .select("id, name, mime_type")
      .eq("org_id", ctx.orgId)
      .or(`name.ilike.${q},original_name.ilike.${q}`)
      .limit(5),
    supabase
      .from("calendar_events")
      .select("id, title, start_at")
      .eq("org_id", ctx.orgId)
      .ilike("title", q)
      .limit(5),
    supabase
      .from("messages")
      .select("id, subject, recipient_email, recipient_name")
      .eq("org_id", ctx.orgId)
      .or(`subject.ilike.${q},recipient_email.ilike.${q},recipient_name.ilike.${q}`)
      .limit(5),
    supabase
      .from("message_templates")
      .select("id, name, subject")
      .eq("org_id", ctx.orgId)
      .or(`name.ilike.${q},subject.ilike.${q}`)
      .limit(5),
    supabase
      .from("forms")
      .select("id, name, status")
      .eq("org_id", ctx.orgId)
      .ilike("name", q)
      .limit(5),
    supabase
      .from("time_entries")
      .select("id, description, duration_minutes, date")
      .eq("org_id", ctx.orgId)
      .ilike("description", q)
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
    ...(tasksRes.data ?? []).map((t) => ({
      id: t.board_id,
      type: "task" as const,
      title: t.title,
      subtitle: null,
    })),
    ...(filesRes.data ?? []).map((f) => ({
      id: f.id,
      type: "file" as const,
      title: f.name,
      subtitle: f.mime_type,
    })),
    ...(eventsRes.data ?? []).map((e) => ({
      id: e.id,
      type: "event" as const,
      title: e.title,
      subtitle: new Date(e.start_at).toLocaleDateString(),
    })),
    ...(messagesRes.data ?? []).map((m) => ({
      id: m.id,
      type: "message" as const,
      title: m.subject || m.recipient_email || "Message",
      subtitle: m.recipient_name,
    })),
    ...(templatesRes.data ?? []).map((t) => ({
      id: t.id,
      type: "template" as const,
      title: t.name,
      subtitle: t.subject,
    })),
    ...(formsRes.data ?? []).map((f) => ({
      id: f.id,
      type: "form" as const,
      title: f.name,
      subtitle: f.status,
    })),
    ...(timeEntriesRes.data ?? []).map((t) => ({
      id: t.id,
      type: "time_entry" as const,
      title: t.description || "Time entry",
      subtitle: `${(t.duration_minutes / 60).toFixed(1)}h on ${t.date}`,
    })),
  ]

  return { results }
}
