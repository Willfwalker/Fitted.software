import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Building2, Mail, Phone, Briefcase } from "lucide-react"
import { getServerContext } from "@/lib/supabase/context"
import { ActivityTimeline } from "@/components/crm/ActivityTimeline"
import { NoteForm } from "@/components/crm/NoteForm"
import type { Activity, Deal } from "@/lib/types/crm"

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await getServerContext()
  if (!ctx) return null

  const { supabase, orgId } = ctx

  // Fetch contact with company
  const { data: contact } = await supabase
    .from("contacts")
    .select("*, company:companies(id, name)")
    .eq("id", id)
    .eq("org_id", orgId)
    .single()

  if (!contact) notFound()

  // Fetch linked deals
  const { data: deals } = await supabase
    .from("deals")
    .select("id, title, value, stage, priority")
    .eq("contact_id", id)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  // Fetch activities
  const { data: activities } = await supabase
    .from("activities")
    .select("*")
    .eq("contact_id", id)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

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
        href="/crm/contacts"
        className="inline-flex items-center gap-1.5 text-[0.82rem] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors font-light"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Contacts
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — Contact info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
            <h2 className="font-[family-name:var(--font-display)] text-[1.5rem] text-[var(--text)] tracking-tight">
              {contact.first_name} {contact.last_name}
            </h2>
            {contact.title && (
              <p className="text-[0.88rem] text-[var(--text-muted)] font-light mt-1">
                {contact.title}
              </p>
            )}

            <div className="mt-5 space-y-3">
              {contact.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="h-3.5 w-3.5 text-[var(--text-dim)]" />
                  <span className="text-[0.85rem] text-[var(--text-muted)] font-light">{contact.email}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="h-3.5 w-3.5 text-[var(--text-dim)]" />
                  <span className="text-[0.85rem] text-[var(--text-muted)] font-light">{contact.phone}</span>
                </div>
              )}
              {contact.company && (
                <div className="flex items-center gap-2.5">
                  <Building2 className="h-3.5 w-3.5 text-[var(--text-dim)]" />
                  <Link
                    href={`/crm/companies/${contact.company.id}`}
                    className="text-[0.85rem] text-[var(--accent)] hover:underline font-light"
                  >
                    {contact.company.name}
                  </Link>
                </div>
              )}
            </div>

            {contact.notes && (
              <div className="mt-5 pt-5 border-t border-[var(--border)]">
                <p className="text-[0.72rem] font-medium uppercase tracking-wider text-[var(--text-dim)] mb-2">Notes</p>
                <p className="text-[0.85rem] text-[var(--text-muted)] font-light whitespace-pre-wrap">{contact.notes}</p>
              </div>
            )}

          </div>

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
                    href="/crm/deals"
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
            <NoteForm entityType="contact" entityId={id} />
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
