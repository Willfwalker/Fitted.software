import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getServerContext } from "@/lib/supabase/context"
import { ActivityTimeline } from "@/components/crm/ActivityTimeline"
import { NoteForm } from "@/components/crm/NoteForm"
import { DealDetailCard } from "@/components/crm/DealDetailCard"
import type { Deal, Activity } from "@/lib/types/crm"
import type { UiConfig } from "@/lib/types/ui-config"

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await getServerContext()
  if (!ctx) return null

  const { supabase, orgId } = ctx

  const { data: deal } = await supabase
    .from("deals")
    .select("*, contact:contacts(id, first_name, last_name, email), company:companies(id, name)")
    .eq("id", id)
    .eq("org_id", orgId)
    .single()

  if (!deal) notFound()

  const { data: activities } = await supabase
    .from("activities")
    .select("*")
    .eq("deal_id", id)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  // Get contacts, companies, and ui config for the edit form
  const [{ data: contacts }, { data: companies }, { data: uiConfigRow }] = await Promise.all([
    supabase.from("contacts").select("id, first_name, last_name").eq("org_id", orgId).order("first_name"),
    supabase.from("companies").select("id, name").eq("org_id", orgId).order("name"),
    supabase.from("ui_configs").select("config").eq("org_id", orgId).eq("entity_type", "deals").single(),
  ])

  const uiConfig = (uiConfigRow?.config as UiConfig) ?? { fields: [] }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/crm/deals"
        className="inline-flex items-center gap-1.5 text-[0.82rem] text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors font-light"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Deals
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Deal info */}
        <div className="lg:col-span-3">
          <DealDetailCard
            deal={deal as Deal}
            contacts={contacts ?? []}
            companies={companies ?? []}
            uiConfig={uiConfig}
          />
        </div>

        {/* Right: Activity timeline + NoteForm */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
            <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)] mb-5">
              Activity
            </h3>
            <NoteForm entityType="deal" entityId={id} />
            <div className="mt-6">
              <ActivityTimeline activities={(activities ?? []) as Activity[]} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
