import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { StatCard } from "@/components/dashboard/StatCard"
import { RevenueChart } from "@/components/dashboard/RevenueChart"
import { ActivityFeed } from "@/components/dashboard/ActivityFeed"
import { TeamList } from "@/components/dashboard/TeamList"
import { UserPlus, Briefcase, Building2 } from "lucide-react"

interface DashboardFallbackProps {
  userId: string
  orgId: string
}

export async function DashboardFallback({
  userId,
  orgId,
}: DashboardFallbackProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let contactsCount = 0
  let activeDealsCount = 0
  let activeDealsValue = 0
  let wonDealsValue = 0
  let companiesCount = 0
  let activities: {
    id: string
    type: string
    title: string
    content: string | null
    created_at: string
    contact_id: string | null
    deal_id: string | null
    company_id: string | null
  }[] = []

  let revenueData: { month: string; revenue: number }[] = []

  const [
    contactsRes,
    activeDealsRes,
    wonDealsRes,
    companiesRes,
    activitiesRes,
    wonDealsByMonthRes,
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
      .limit(8),
    supabase
      .from("deals")
      .select("value, closed_at")
      .eq("org_id", orgId)
      .eq("stage", "WON")
      .not("closed_at", "is", null),
  ])

  contactsCount = contactsRes.count ?? 0
  companiesCount = companiesRes.count ?? 0

  if (activeDealsRes.data) {
    activeDealsCount = activeDealsRes.data.length
    activeDealsValue = activeDealsRes.data.reduce(
      (sum, d) => sum + (Number(d.value) || 0),
      0
    )
  }

  if (wonDealsRes.data) {
    wonDealsValue = wonDealsRes.data.reduce(
      (sum, d) => sum + (Number(d.value) || 0),
      0
    )
  }

  activities = (activitiesRes.data ?? []) as typeof activities

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
  revenueData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
    month,
    revenue,
  }))

  let dbMembers: {
    id: string
    role: string
    user: { name: string | null; email: string; image: string | null }
  }[] = []

  const { data: orgMembers } = await supabase
    .from("organization_members")
    .select("id, user_id, role")
    .eq("org_id", orgId)

  if (orgMembers) {
    dbMembers = orgMembers.map((m) => ({
      id: m.id,
      role: m.role,
      user: {
        name:
          m.user_id === userId
            ? user?.user_metadata?.full_name ?? null
            : null,
        email:
          m.user_id === userId ? (user?.email ?? "unknown") : m.user_id,
        image: null,
      },
    }))
  }

  const mockMembers = [
    {
      id: "mock-1",
      role: "DESIGNER",
      user: { name: "Sarah Chen", email: "sarah@fitted.agency", image: null },
    },
    {
      id: "mock-2",
      role: "DEVELOPER",
      user: {
        name: "Marcus Rivera",
        email: "marcus@fitted.agency",
        image: null,
      },
    },
    {
      id: "mock-3",
      role: "PM",
      user: { name: "Emily Park", email: "emily@fitted.agency", image: null },
    },
  ]
  const members = [...dbMembers, ...mockMembers]

  const greeting = getGreeting()
  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ??
    user?.user_metadata?.name?.split(" ")[0] ??
    "there"

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="p-8 lg:p-12 max-w-[1400px] space-y-8">
      <div
        className="animate-dash-in flex items-end justify-between"
        style={{ animationDelay: "0ms" }}
      >
        <div>
          <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-[var(--accent)] mb-2 block">
            Dashboard
          </span>
          <h1 className="font-[family-name:var(--font-display)] text-[2.8rem] text-[var(--text)] tracking-tight leading-tight">
            {greeting}, {firstName}
          </h1>
          <p className="mt-2 text-[0.9rem] text-[var(--text-muted)] font-light">
            Here&apos;s what&apos;s happening with your agency today.
          </p>
        </div>
        <p className="hidden sm:block text-[0.82rem] text-[var(--text-dim)] font-light pb-1">
          {today}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="animate-dash-in" style={{ animationDelay: "60ms" }}>
          <StatCard
            title="Contacts"
            value={String(contactsCount)}
            subtitle={`${companiesCount} companies`}
            changeType="neutral"
            icon="users"
          />
        </div>
        <div className="animate-dash-in" style={{ animationDelay: "120ms" }}>
          <StatCard
            title="Active Deals"
            value={String(activeDealsCount)}
            subtitle={
              activeDealsValue > 0
                ? `$${activeDealsValue.toLocaleString()} in pipeline`
                : "No active deals"
            }
            changeType="neutral"
            icon="folder"
          />
        </div>
        <div className="animate-dash-in" style={{ animationDelay: "180ms" }}>
          <StatCard
            title="Pipeline Value"
            value={`$${wonDealsValue.toLocaleString()}`}
            subtitle="Won deals"
            changeType="positive"
            icon="dollar"
          />
        </div>
        <div className="animate-dash-in" style={{ animationDelay: "240ms" }}>
          <StatCard
            title="Companies"
            value={String(companiesCount)}
            subtitle={`${contactsCount} contacts total`}
            changeType="neutral"
            icon="clock"
          />
        </div>
      </div>

      <div
        className="animate-dash-in flex flex-wrap gap-3"
        style={{ animationDelay: "270ms" }}
      >
        <Link
          href="/crm/contacts?create=true"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border)] text-[0.82rem] text-[var(--text-muted)] font-light hover:border-[var(--accent)] hover:text-[var(--text)] transition-colors"
        >
          <UserPlus className="h-3.5 w-3.5" strokeWidth={1.8} />
          New Contact
        </Link>
        <Link
          href="/crm/deals?create=true"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border)] text-[0.82rem] text-[var(--text-muted)] font-light hover:border-[var(--accent)] hover:text-[var(--text)] transition-colors"
        >
          <Briefcase className="h-3.5 w-3.5" strokeWidth={1.8} />
          New Deal
        </Link>
        <Link
          href="/crm/companies?create=true"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border)] text-[0.82rem] text-[var(--text-muted)] font-light hover:border-[var(--accent)] hover:text-[var(--text)] transition-colors"
        >
          <Building2 className="h-3.5 w-3.5" strokeWidth={1.8} />
          New Company
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div
          className="lg:col-span-3 animate-dash-in"
          style={{ animationDelay: "300ms" }}
        >
          <RevenueChart data={revenueData} />
        </div>
        <div
          className="lg:col-span-2 animate-dash-in"
          style={{ animationDelay: "360ms" }}
        >
          <ActivityFeed activities={activities} />
        </div>
      </div>

      <div className="animate-dash-in" style={{ animationDelay: "420ms" }}>
        <TeamList members={members} />
      </div>
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}
