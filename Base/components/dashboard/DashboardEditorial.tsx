import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import Link from "next/link"
import { EditorialChart } from "./EditorialChart"
import { DEAL_STAGES, type DealStage } from "@/lib/types/crm"

interface Props {
  userId: string
  orgId: string
}

const ACTIVITY_COLORS: Record<string, string> = {
  NOTE: "#8A817A",
  EMAIL: "#5B8DEF",
  CALL: "#5EC69A",
  MEETING: "#E8A84C",
  DEAL_CREATED: "#D4734E",
  DEAL_STAGE_CHANGED: "#D4734E",
  CONTACT_CREATED: "#5EC69A",
  COMPANY_CREATED: "#5B8DEF",
}

function numWord(n: number, capitalize = true): string {
  const words = [
    "zero", "one", "two", "three", "four", "five", "six",
    "seven", "eight", "nine", "ten", "eleven", "twelve",
  ]
  const w = words[n] ?? String(n)
  return capitalize ? w.charAt(0).toUpperCase() + w.slice(1) : w
}

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `$${(n / 1000).toFixed(1)}k`
  return `$${n.toLocaleString()}`
}

function timeOnly(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) {
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).toLowerCase().replace(" ", "")
  }
  const diffMs = now.getTime() - d.getTime()
  const days = Math.floor(diffMs / 86400000)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

interface LedeInput {
  closedThisWeekCount: number
  closedThisWeekValue: number
  activeDealsCount: number
  activeDealsValue: number
  contactsCount: number
  companiesCount: number
  wonDealsValue: number
}

function generateLede(d: LedeInput): { headline: string } {
  const pipeline = fmtMoney(d.activeDealsValue)

  if (d.closedThisWeekCount > 0) {
    const noun = d.closedThisWeekCount === 1 ? "deal" : "deals"
    return {
      headline: `${numWord(d.closedThisWeekCount)} ${noun} closed this week, ${fmtMoney(d.closedThisWeekValue)} in new revenue`,
    }
  }

  if (d.activeDealsCount > 0) {
    return {
      headline: `${numWord(d.activeDealsCount)} ${d.activeDealsCount === 1 ? "deal moving" : "deals moving"} through the pipeline, ${pipeline} on the table`,
    }
  }

  if (d.contactsCount > 0) {
    return {
      headline: `${d.contactsCount} ${d.contactsCount === 1 ? "contact" : "contacts"} across ${d.companiesCount} ${d.companiesCount === 1 ? "company" : "companies"} on the books`,
    }
  }

  return {
    headline: `A fresh start`,
  }
}

function roleTitle(role: string): string {
  if (role === "OWNER") return "Owner"
  if (role === "ADMIN") return "Admin"
  return "Member"
}

export async function DashboardEditorial({ userId, orgId }: Props) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const weekAgoISO = new Date(Date.now() - 7 * 86400000).toISOString()

  const [
    contactsRes,
    activeDealsRes,
    wonDealsRes,
    companiesRes,
    activitiesRes,
    wonDealsByMonthRes,
    closedThisWeekRes,
    finalStageRes,
    stalledRes,
    topDealsRes,
  ] = await Promise.all([
    supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId),
    supabase
      .from("deals")
      .select("value")
      .eq("org_id", orgId)
      .not("stage", "in", "(WON,LOST)"),
    supabase
      .from("deals")
      .select("value")
      .eq("org_id", orgId)
      .eq("stage", "WON"),
    supabase
      .from("companies")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId),
    supabase
      .from("activities")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(7),
    supabase
      .from("deals")
      .select("value, closed_at")
      .eq("org_id", orgId)
      .eq("stage", "WON")
      .not("closed_at", "is", null),
    supabase
      .from("deals")
      .select("value")
      .eq("org_id", orgId)
      .eq("stage", "WON")
      .gte("closed_at", weekAgoISO),
    supabase
      .from("deals")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("stage", "NEGOTIATION"),
    supabase
      .from("deals")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .not("stage", "in", "(WON,LOST)")
      .lt("updated_at", weekAgoISO),
    supabase
      .from("deals")
      .select("id, title, value, stage, company:companies(id, name)")
      .eq("org_id", orgId)
      .not("stage", "in", "(WON,LOST)")
      .order("value", { ascending: false, nullsFirst: false })
      .limit(5),
  ])

  const contactsCount = contactsRes.count ?? 0
  const companiesCount = companiesRes.count ?? 0

  const activeDealsCount = activeDealsRes.data?.length ?? 0
  const activeDealsValue =
    activeDealsRes.data?.reduce((s, d) => s + (Number(d.value) || 0), 0) ?? 0
  const wonDealsValue =
    wonDealsRes.data?.reduce((s, d) => s + (Number(d.value) || 0), 0) ?? 0

  const closedThisWeekCount = closedThisWeekRes.data?.length ?? 0
  const closedThisWeekValue =
    closedThisWeekRes.data?.reduce(
      (s, d) => s + (Number(d.value) || 0),
      0
    ) ?? 0
  const finalStageCount = finalStageRes.count ?? 0
  const stalledCount = stalledRes.count ?? 0

  type TopDeal = {
    id: string
    title: string
    value: number | null
    stage: DealStage
    company: { id: string; name: string } | null
  }
  const topDeals = (topDealsRes.data ?? []) as unknown as TopDeal[]

  const activities = (activitiesRes.data ?? []) as {
    id: string
    type: string
    title: string
    content: string | null
    created_at: string
    contact_id: string | null
    deal_id: string | null
    company_id: string | null
  }[]

  const monthlyRevenue: Record<string, number> = {}
  const now2 = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now2.getFullYear(), now2.getMonth() - i, 1)
    const key = d.toLocaleString("en-US", { month: "short" })
    monthlyRevenue[key] = 0
  }
  for (const deal of wonDealsByMonthRes.data ?? []) {
    if (!deal.closed_at) continue
    const d = new Date(deal.closed_at)
    const key = d.toLocaleString("en-US", { month: "short" })
    if (key in monthlyRevenue) {
      monthlyRevenue[key] += Number(deal.value) || 0
    }
  }
  const revenueData = Object.entries(monthlyRevenue).map(
    ([month, revenue]) => ({ month, revenue })
  )

  // Members
  const { data: orgMembers } = await supabase
    .from("organization_members")
    .select("id, user_id, role")
    .eq("org_id", orgId)

  const members: {
    id: string
    role: string
    user: { name: string | null; email: string }
  }[] = []

  if (orgMembers) {
    const otherUserIds = orgMembers
      .filter((m) => m.user_id !== userId)
      .map((m) => m.user_id)
    const userDetailsMap = new Map<
      string,
      { name: string | null; email: string }
    >()
    if (otherUserIds.length > 0) {
      const admin = createAdminClient()
      for (const uid of otherUserIds) {
        const { data } = await admin.auth.admin.getUserById(uid)
        if (data?.user) {
          userDetailsMap.set(uid, {
            name:
              data.user.user_metadata?.full_name ??
              data.user.user_metadata?.name ??
              null,
            email: data.user.email ?? "unknown",
          })
        }
      }
    }
    for (const m of orgMembers) {
      if (m.user_id === userId) {
        members.push({
          id: m.id,
          role: m.role,
          user: {
            name: user?.user_metadata?.full_name ?? null,
            email: user?.email ?? "unknown",
          },
        })
      } else {
        const d = userDetailsMap.get(m.user_id)
        members.push({
          id: m.id,
          role: m.role,
          user: {
            name: d?.name ?? null,
            email: d?.email ?? m.user_id,
          },
        })
      }
    }
  }

  const lede = generateLede({
    closedThisWeekCount,
    closedThisWeekValue,
    activeDealsCount,
    activeDealsValue,
    contactsCount,
    companiesCount,
    wonDealsValue,
  })

  const now = new Date()
  const fullDate = now
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
    .toUpperCase()
  const filedAt = now
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase()
    .replace(" ", "")

  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ??
    user?.user_metadata?.name?.split(" ")[0] ??
    "you"

  const hasActivity = activities.length > 0

  type Callout = { label: string; value: string; href: string }
  const callouts: Callout[] = []
  if (activeDealsValue > 0) {
    callouts.push({
      label: "in play",
      value: fmtMoney(activeDealsValue),
      href: "/crm/deals",
    })
  }
  if (finalStageCount > 0) {
    callouts.push({
      label: "at final stage",
      value: String(finalStageCount),
      href: "/crm/deals",
    })
  }
  if (stalledCount > 0) {
    callouts.push({
      label: "stalled 7+ days",
      value: String(stalledCount),
      href: "/crm/deals",
    })
  }
  if (callouts.length === 0 && closedThisWeekCount > 0) {
    callouts.push({
      label: closedThisWeekCount === 1 ? "deal closed this week" : "deals closed this week",
      value: String(closedThisWeekCount),
      href: "/crm/deals",
    })
  }
  if (callouts.length === 0) {
    callouts.push({
      label: contactsCount === 1 ? "contact on the books" : "contacts on the books",
      value: String(contactsCount),
      href: "/crm/contacts",
    })
  }

  return (
    <div className="max-w-[1400px] px-6 pb-16 pt-8 lg:px-12 lg:pt-10">
      {/* Page chrome */}
      <div className="animate-dash-in mb-10 flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--border)] pb-3 text-[0.62rem] font-medium uppercase tracking-[0.28em] text-[var(--text-dim)]">
        <span>Overview</span>
        <span className="tabular-nums">{fullDate}</span>
      </div>

      {/* =============== LEDE + SIDEBAR =============== */}
      <section className="grid grid-cols-12 gap-x-8 gap-y-10">
        {/* Lede */}
        <article
          className="animate-dash-in col-span-12 lg:col-span-8"
          style={{ animationDelay: "80ms" }}
        >
          <h2
            className="mb-7 font-[family-name:var(--font-display)] text-[clamp(2rem,4.4vw,3.6rem)] leading-[1.04] text-[var(--text)]"
            style={{ letterSpacing: "-0.012em" }}
          >
            {lede.headline}
          </h2>

          <nav className="flex flex-wrap items-baseline gap-y-3">
            {callouts.map((c, i) => (
              <span key={c.label} className="flex items-baseline">
                {i > 0 && (
                  <span className="mx-5 text-[0.9rem] text-[var(--text-dim)]">
                    ·
                  </span>
                )}
                <Link
                  href={c.href}
                  className="group inline-flex items-baseline gap-2 border-b border-transparent pb-0.5 transition-colors hover:border-[var(--accent)]"
                >
                  <span className="font-[family-name:var(--font-display)] text-[1.5rem] leading-none tabular-nums text-[var(--text)] transition-colors group-hover:text-[var(--accent)]">
                    {c.value}
                  </span>
                  <span className="text-[0.82rem] font-light text-[var(--text-muted)]">
                    {c.label}
                  </span>
                </Link>
              </span>
            ))}
          </nav>

          {/* Top Open Deals */}
          <div className="mt-10">
            <div className="mb-2 flex items-baseline justify-between border-b border-[var(--border)] pb-3">
              <span className="text-[0.62rem] font-medium uppercase tracking-[0.28em] text-[var(--accent)]">
                Open Deals
              </span>
              <span className="font-[family-name:var(--font-display)] italic text-[0.9rem] text-[var(--text-dim)]">
                top {topDeals.length} by value
              </span>
            </div>

            {topDeals.length > 0 ? (
              <ul className="flex flex-col">
                {topDeals.map((d, i) => {
                  const stageInfo = DEAL_STAGES.find((s) => s.value === d.stage)
                  return (
                    <li
                      key={d.id}
                      className={
                        i < topDeals.length - 1
                          ? "border-b border-[rgba(42,37,32,0.6)]"
                          : ""
                      }
                    >
                      <Link
                        href={`/crm/deals/${d.id}`}
                        className="group flex items-baseline gap-4 py-3.5 transition-colors"
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 translate-y-[-2px] rounded-full"
                          style={{ background: stageInfo?.color ?? "#8A817A" }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.95rem] font-normal text-[var(--text)] transition-colors group-hover:text-[var(--accent)]">
                            {d.title}
                          </p>
                          <p className="mt-0.5 truncate font-[family-name:var(--font-display)] text-[0.82rem] italic text-[var(--text-dim)]">
                            {d.company?.name ?? "No company"}{" "}
                            <span className="not-italic">·</span>{" "}
                            {stageInfo?.label ?? d.stage}
                          </p>
                        </div>
                        <span className="shrink-0 font-[family-name:var(--font-display)] text-[1.3rem] tabular-nums leading-none text-[var(--text)]">
                          {d.value != null ? fmtMoney(d.value) : "—"}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="py-8 text-center font-[family-name:var(--font-display)] italic text-[var(--text-dim)]">
                — No open deals —
              </p>
            )}
          </div>

          <div className="mt-5 text-[0.62rem] font-medium uppercase tracking-[0.22em] text-[var(--text-dim)]">
            Updated {filedAt}
          </div>
        </article>

        {/* By The Numbers — sidebar ledger */}
        <aside
          className="animate-dash-in col-span-12 lg:col-span-4"
          style={{ animationDelay: "160ms" }}
        >
          <div className="lg:border-l lg:border-[var(--border)] lg:pl-7">
            <div className="mb-4 flex items-baseline justify-between border-b border-[var(--border)] pb-3 text-[0.62rem] font-medium uppercase tracking-[0.28em] text-[var(--accent)]">
              <span>By The Numbers</span>
              <span className="font-[family-name:var(--font-display)] italic font-normal normal-case tracking-normal text-[0.82rem] text-[var(--text-dim)]">
                as filed
              </span>
            </div>

            <ul className="flex flex-col">
              <LedgerRow label="Contacts" value={contactsCount.toLocaleString()} />
              <LedgerRow label="Companies" value={companiesCount.toLocaleString()} />
              <LedgerRow label="Active Deals" value={activeDealsCount.toLocaleString()} />
              <LedgerRow label="Pipeline" value={fmtMoney(activeDealsValue)} />
              <LedgerRow
                label="Won · All Time"
                value={fmtMoney(wonDealsValue)}
                emphasis="positive"
              />
              <LedgerRow
                label="This Week"
                value={closedThisWeekCount > 0 ? `+${fmtMoney(closedThisWeekValue)}` : "—"}
                emphasis={closedThisWeekCount > 0 ? "positive" : "muted"}
              />
            </ul>

            {/* Classifieds */}
            <div className="mt-8">
              <div className="mb-3 border-b border-dashed border-[var(--border)] pb-2 text-[0.62rem] font-medium uppercase tracking-[0.28em] text-[var(--text-dim)]">
                Quick Filings
              </div>
              <div className="flex flex-col">
                <ClassifiedLink href="/crm/contacts?create=true" label="New contact" />
                <ClassifiedLink href="/crm/deals?create=true" label="New deal" />
                <ClassifiedLink href="/crm/companies?create=true" label="New company" />
              </div>
            </div>
          </div>
        </aside>
      </section>

      {/* =============== REVENUE + ACTIVITY =============== */}
      <section
        className="mt-12 grid grid-cols-12 gap-x-8 gap-y-10 border-t border-[var(--border)] pt-10"
      >
        {/* Revenue */}
        <div
          className="animate-dash-in col-span-12 lg:col-span-7"
          style={{ animationDelay: "220ms" }}
        >
          <div className="mb-5 flex items-baseline justify-between border-b border-[var(--border)] pb-3">
            <span className="text-[0.62rem] font-medium uppercase tracking-[0.28em] text-[var(--accent)]">
              Revenue
            </span>
            <span className="font-[family-name:var(--font-display)] italic text-[0.9rem] text-[var(--text-dim)]">
              last six months
            </span>
          </div>

          <EditorialChart data={revenueData} />
        </div>

        {/* Activity */}
        <div
          className="animate-dash-in col-span-12 lg:col-span-5"
          style={{ animationDelay: "280ms" }}
        >
          <div className="lg:border-l lg:border-[var(--border)] lg:pl-7">
            <div className="mb-4 flex items-baseline justify-between border-b border-[var(--border)] pb-3">
              <span className="text-[0.62rem] font-medium uppercase tracking-[0.28em] text-[var(--accent)]">
                Activity
              </span>
              <span className="font-[family-name:var(--font-display)] italic text-[0.9rem] text-[var(--text-dim)]">
                latest
              </span>
            </div>

            {hasActivity ? (
              <ol className="flex flex-col">
                {activities.map((a, i) => (
                  <li
                    key={a.id}
                    className={`group py-3.5 ${i < activities.length - 1 ? "border-b border-[rgba(42,37,32,0.7)]" : ""}`}
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="w-[64px] shrink-0 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-[var(--text-dim)] tabular-nums">
                        {timeOnly(a.created_at)}
                      </span>
                      <span
                        className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{
                          background: ACTIVITY_COLORS[a.type] ?? "#8A817A",
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.88rem] font-light leading-snug text-[var(--text)]">
                          {a.title}
                        </p>
                        {a.content && (
                          <p className="mt-0.5 line-clamp-1 font-[family-name:var(--font-display)] text-[0.82rem] italic leading-snug text-[var(--text-dim)]">
                            — {a.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="py-10 text-center">
                <p className="font-[family-name:var(--font-display)] text-[1.1rem] italic text-[var(--text-dim)]">
                  — Nothing yet —
                </p>
                <p className="mt-2 text-[0.75rem] font-light text-[var(--text-dim)]">
                  Activity will post here as you work.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =============== TEAM =============== */}
      <section className="mt-12 border-t border-[var(--border)] pt-10">
        <div className="mb-6 flex items-baseline justify-between border-b border-[var(--border)] pb-3">
          <span className="text-[0.62rem] font-medium uppercase tracking-[0.28em] text-[var(--accent)]">
            Team
          </span>
          <span className="font-[family-name:var(--font-display)] italic text-[0.9rem] text-[var(--text-dim)]">
            {members.length}{" "}
            {members.length === 1 ? "member" : "members"}
          </span>
        </div>

        {members.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((m, i) => (
              <div
                key={m.id}
                className="animate-dash-in flex items-start gap-4 border-b border-dashed border-[var(--border)] pb-5"
                style={{ animationDelay: `${340 + i * 60}ms` }}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] font-[family-name:var(--font-display)] text-[1.25rem] text-[var(--accent)]">
                  {(m.user.name?.[0] ?? m.user.email[0]).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-[family-name:var(--font-display)] text-[1.15rem] leading-tight text-[var(--text)]">
                    {m.user.name || m.user.email.split("@")[0]}
                  </p>
                  <p className="mt-1 text-[0.62rem] font-medium uppercase tracking-[0.22em] text-[var(--text-dim)]">
                    {roleTitle(m.role)}
                  </p>
                  <p className="mt-1.5 truncate font-[family-name:var(--font-display)] text-[0.82rem] italic text-[var(--text-dim)]">
                    {m.user.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center font-[family-name:var(--font-display)] italic text-[var(--text-dim)]">
            — No team members yet —
          </p>
        )}
      </section>
    </div>
  )
}

function LedgerRow({
  label,
  value,
  emphasis = "default",
}: {
  label: string
  value: string
  emphasis?: "default" | "positive" | "muted"
}) {
  const valueColor =
    emphasis === "positive"
      ? "text-[#5EC69A]"
      : emphasis === "muted"
        ? "text-[var(--text-dim)]"
        : "text-[var(--text)]"

  return (
    <li className="flex items-baseline gap-2 py-3">
      <span className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-[var(--text-dim)]">
        {label}
      </span>
      <span className="mb-[0.45em] flex-1 border-b border-dotted border-[var(--border)]" />
      <span
        className={`font-[family-name:var(--font-display)] text-[1.45rem] leading-none tabular-nums ${valueColor}`}
      >
        {value}
      </span>
    </li>
  )
}

function ClassifiedLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group flex items-baseline gap-2 py-1.5 text-[0.85rem] font-light text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
    >
      <span className="text-[var(--accent)]">+</span>
      <span>{label}</span>
      <span className="mb-1 flex-1 border-b border-dotted border-[var(--border)]" />
      <span className="text-[0.6rem] font-medium uppercase tracking-[0.18em] text-[var(--text-dim)] transition-colors group-hover:text-[var(--accent)]">
        file →
      </span>
    </Link>
  )
}
