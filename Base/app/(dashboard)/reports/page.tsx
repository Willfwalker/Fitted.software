import { getServerContext } from "@/lib/supabase/context"
import { redirect } from "next/navigation"
import { ReportsView } from "@/components/reports/ReportsView"
import { DEAL_STAGES, ACTIVITY_TYPE_CONFIG, type ActivityType } from "@/lib/types/crm"

export default async function ReportsPage() {
  const ctx = await getServerContext()
  if (!ctx) redirect("/login")

  // Fetch all report data in parallel
  const [wonDealsRes, allDealsRes, activitiesRes] = await Promise.all([
    ctx.supabase
      .from("deals")
      .select("value, closed_at")
      .eq("org_id", ctx.orgId)
      .eq("stage", "WON")
      .not("closed_at", "is", null)
      .order("closed_at"),
    ctx.supabase
      .from("deals")
      .select("stage, value")
      .eq("org_id", ctx.orgId),
    ctx.supabase
      .from("activities")
      .select("type")
      .eq("org_id", ctx.orgId)
      .gte("created_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  // Revenue over time: WON deals grouped by month
  const monthlyRevenue: Record<string, number> = {}
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" })
    monthlyRevenue[key] = 0
  }

  for (const deal of wonDealsRes.data ?? []) {
    if (!deal.closed_at) continue
    const d = new Date(deal.closed_at)
    const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" })
    if (key in monthlyRevenue) {
      monthlyRevenue[key] += Number(deal.value) || 0
    }
  }

  const revenueData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue }))

  // Pipeline summary: deals by stage with value
  const stageMap: Record<string, { count: number; value: number }> = {}
  for (const deal of allDealsRes.data ?? []) {
    if (!stageMap[deal.stage]) stageMap[deal.stage] = { count: 0, value: 0 }
    stageMap[deal.stage].count++
    stageMap[deal.stage].value += Number(deal.value) || 0
  }

  const pipelineData = DEAL_STAGES.map((s) => ({
    stage: s.label,
    count: stageMap[s.value]?.count || 0,
    value: stageMap[s.value]?.value || 0,
    color: s.color,
  }))

  // Conversion funnel: count at each stage
  const funnelStages = ["LEAD", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON"] as const
  const funnelData = funnelStages.map((stage) => {
    const config = DEAL_STAGES.find((s) => s.value === stage)!
    return {
      stage: config.label,
      count: stageMap[stage]?.count || 0,
      color: config.color,
    }
  })

  // Activity summary: grouped by type
  const activityMap: Record<string, number> = {}
  for (const a of activitiesRes.data ?? []) {
    const label = ACTIVITY_TYPE_CONFIG[a.type as ActivityType]?.label || a.type
    activityMap[label] = (activityMap[label] || 0) + 1
  }

  const activityData = Object.entries(activityMap)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="p-8 lg:p-12 max-w-[1400px] space-y-6">
      <div>
        <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-[var(--accent)] mb-2 block">
          Analytics
        </span>
        <h1 className="font-[family-name:var(--font-display)] text-[2.2rem] text-[var(--text)] tracking-tight leading-tight">
          Reports
        </h1>
        <p className="mt-2 text-[0.85rem] text-[var(--text-muted)] font-light">
          Overview of your CRM performance
        </p>
      </div>

      <ReportsView
        revenueData={revenueData}
        pipelineData={pipelineData}
        funnelData={funnelData}
        activityData={activityData}
      />
    </div>
  )
}
