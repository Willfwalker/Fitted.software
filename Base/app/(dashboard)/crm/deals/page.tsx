import { getServerContext } from "@/lib/supabase/context"
import { DealsPipeline } from "@/components/crm/DealsPipeline"
import type { Deal } from "@/lib/types/crm"

export default async function DealsPage() {
  const ctx = await getServerContext()
  if (!ctx) return null

  const { supabase, orgId } = ctx

  const [{ data: deals }, { data: contacts }, { data: companies }] = await Promise.all([
    supabase
      .from("deals")
      .select("*, contact:contacts(id, first_name, last_name), company:companies(id, name)")
      .eq("org_id", orgId)
      .order("position", { ascending: true }),
    supabase.from("contacts").select("id, first_name, last_name").eq("org_id", orgId).order("first_name"),
    supabase.from("companies").select("id, name").eq("org_id", orgId).order("name"),
  ])

  return (
    <DealsPipeline
      deals={(deals ?? []) as Deal[]}
      contacts={contacts ?? []}
      companies={companies ?? []}
    />
  )
}
