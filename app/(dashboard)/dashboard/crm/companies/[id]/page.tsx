import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Globe, Mail, Phone, MapPin, Users, Briefcase } from "lucide-react"
import { getServerContext } from "@/lib/supabase/context"
import { ActivityTimeline } from "@/components/crm/ActivityTimeline"
import { NoteForm } from "@/components/crm/NoteForm"
import type { Activity, Contact, Deal } from "@/lib/types/crm"
import type { UiConfig } from "@/lib/types/ui-config"

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await getServerContext()
  if (!ctx) return null

  const { supabase, orgId } = ctx

  // Fetch company
  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .eq("org_id", orgId)
    .single()

  if (!company) notFound()

  // Fetch linked contacts
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, email, title")
    .eq("company_id", id)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  // Fetch linked deals
  const { data: deals } = await supabase
    .from("deals")
    .select("id, title, value, stage, priority")
    .eq("company_id", id)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  // Fetch activities + ui config
  const [{ data: activities }, { data: uiConfigRow }] = await Promise.all([
    supabase.from("activities").select("*").eq("company_id", id).eq("org_id", orgId).order("created_at", { ascending: false }),
    supabase.from("ui_configs").select("config").eq("org_id", orgId).eq("entity_type", "companies").single(),
  ])

  const uiConfig = (uiConfigRow?.config as UiConfig) ?? { fields: [] }

  const stageColors: Record<string, string> = {
    LEAD: "#8A817A",
    QUALIFIED: "#5B8DEF",
    PROPOSAL: "#D4734E",
    NEGOTIATION: "#E8A84C",
    WON: "#5EC69A",
    LOST: "#EF5B5B",
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/crm/companies"
        className="inline-flex items-center gap-1.5 text-[0.82rem] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors font-light"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Companies
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — Company info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
            <h2 className="font-[family-name:var(--font-display)] text-[1.5rem] text-[var(--text)] tracking-tight">
              {company.name}
            </h2>
            {company.industry && (
              <p className="text-[0.85rem] text-[var(--text-muted)] font-light mt-1">
                {company.industry}
              </p>
            )}

            <div className="mt-5 space-y-3">
              {company.domain && (
                <div className="flex items-center gap-2.5">
                  <Globe className="h-3.5 w-3.5 text-[var(--text-dim)]" />
                  <span className="text-[0.85rem] text-[var(--text-muted)] font-light">{company.domain}</span>
                </div>
              )}
              {company.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="h-3.5 w-3.5 text-[var(--text-dim)]" />
                  <span className="text-[0.85rem] text-[var(--text-muted)] font-light">{company.email}</span>
                </div>
              )}
              {company.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="h-3.5 w-3.5 text-[var(--text-dim)]" />
                  <span className="text-[0.85rem] text-[var(--text-muted)] font-light">{company.phone}</span>
                </div>
              )}
              {company.address && (
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-3.5 w-3.5 text-[var(--text-dim)]" />
                  <span className="text-[0.85rem] text-[var(--text-muted)] font-light">{company.address}</span>
                </div>
              )}
            </div>

            {company.notes && (
              <div className="mt-5 pt-5 border-t border-[var(--border)]">
                <p className="text-[0.72rem] font-medium uppercase tracking-wider text-[var(--text-dim)] mb-2">Notes</p>
                <p className="text-[0.85rem] text-[var(--text-muted)] font-light whitespace-pre-wrap">{company.notes}</p>
              </div>
            )}

            {uiConfig.fields.length > 0 && company.metadata && Object.keys(company.metadata).length > 0 && (
              <div className="mt-5 pt-5 border-t border-[var(--border)]">
                <p className="text-[0.72rem] font-medium uppercase tracking-wider text-[var(--text-dim)] mb-3">Custom Fields</p>
                <div className="space-y-2">
                  {uiConfig.fields.map((field) => {
                    const val = company.metadata?.[field.key]
                    if (val === undefined || val === null || val === "") return null
                    let display = String(val)
                    if (field.type === "checkbox") display = val === "true" || val === true ? "Yes" : "No"
                    if (field.type === "select" && field.options) {
                      const opt = field.options.find((o) => o.value === val)
                      if (opt) display = opt.label
                    }
                    return (
                      <div key={field.key} className="flex justify-between items-baseline">
                        <span className="text-[0.78rem] text-[var(--text-dim)] font-light">{field.label}</span>
                        <span className="text-[0.85rem] text-[var(--text-muted)] font-light">{display}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Linked contacts */}
          {contacts && contacts.length > 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4 text-[var(--text-dim)]" />
                <h3 className="text-[0.82rem] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Contacts ({contacts.length})
                </h3>
              </div>
              <div className="space-y-2">
                {(contacts as Contact[]).map((c) => (
                  <Link
                    key={c.id}
                    href={`/dashboard/crm/contacts/${c.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] hover:bg-[rgba(232,224,212,0.02)] transition-colors"
                  >
                    <div>
                      <p className="text-[0.85rem] text-[var(--text)] font-light">
                        {c.first_name} {c.last_name}
                      </p>
                      {c.title && (
                        <p className="text-[0.75rem] text-[var(--text-dim)] font-light">{c.title}</p>
                      )}
                    </div>
                    {c.email && (
                      <span className="text-[0.78rem] text-[var(--text-dim)] font-light">{c.email}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Linked deals */}
          {deals && deals.length > 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="h-4 w-4 text-[var(--text-dim)]" />
                <h3 className="text-[0.82rem] font-medium text-[var(--text-muted)] uppercase tracking-wider">Deals</h3>
              </div>
              <div className="space-y-2">
                {(deals as Deal[]).map((deal) => (
                  <Link
                    key={deal.id}
                    href="/dashboard/crm/deals"
                    className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] hover:bg-[rgba(232,224,212,0.02)] transition-colors"
                  >
                    <div>
                      <p className="text-[0.85rem] text-[var(--text)] font-light">{deal.title}</p>
                      <p className="text-[0.75rem] font-light" style={{ color: stageColors[deal.stage] }}>
                        {deal.stage}
                      </p>
                    </div>
                    {deal.value && (
                      <span className="text-[0.85rem] text-[var(--text-muted)] font-light">
                        ${Number(deal.value).toLocaleString()}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column — Activity */}
        <div className="lg:col-span-2 space-y-4">
          {/* Add note */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <h3 className="text-[0.82rem] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-4">
              Add Activity
            </h3>
            <NoteForm entityType="company" entityId={id} />
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <h3 className="text-[0.82rem] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-4">
              Activity
            </h3>
            <ActivityTimeline activities={(activities ?? []) as Activity[]} />
          </div>
        </div>
      </div>
    </div>
  )
}
