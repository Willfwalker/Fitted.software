import { redirect } from "next/navigation"
import { getServerContext } from "@/lib/supabase/context"
import { getTimeEntries, getTimeSummary, getRunningTimer } from "@/lib/actions/time-entries"
import { getMembers } from "@/lib/actions/members"
import { isAtLeast } from "@/lib/rbac/permissions"
import { TimeTrackingPage } from "@/components/time-tracking/TimeTrackingPage"

export default async function TimeTrackingRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const ctx = await getServerContext()
  if (!ctx) redirect("/login")

  const params = await searchParams
  const search = params.q || ""
  const filter = params.filter || ""
  const canViewTeam = isAtLeast(ctx.role, "ADMIN")

  // If member requests team view but lacks permission, force back to "my"
  const currentView = params.view === "team" && canViewTeam ? "team" : "my"

  // Date range params
  const dateFrom = params.from || ""
  const dateTo = params.to || ""

  // Build filters for the query
  const filters: Parameters<typeof getTimeEntries>[0] = {}

  if (filter === "billable") filters.billable = true
  if (filter === "non-billable") filters.billable = false
  if (filter === "invoiced") filters.invoiced = true
  if (filter === "uninvoiced") filters.invoiced = false
  if (dateFrom) filters.date_from = dateFrom
  if (dateTo) filters.date_to = dateTo

  if (currentView === "my") {
    // Always scope to current user in "my" view
    filters.user_id = ctx.user.id
  } else {
    // Team view — optionally filter by selected member
    if (params.member) filters.user_id = params.member
  }

  const summaryFilters: Parameters<typeof getTimeSummary>[0] = {
    user_id: filters.user_id,
    date_from: filters.date_from,
    date_to: filters.date_to,
    billable: filters.billable,
  }

  const promises: [
    ReturnType<typeof getTimeEntries>,
    ReturnType<typeof getTimeSummary>,
    ReturnType<typeof getRunningTimer>,
    ReturnType<typeof getMembers> | Promise<{ data: [] }>,
  ] = [
    getTimeEntries(filters),
    getTimeSummary(summaryFilters),
    getRunningTimer(),
    canViewTeam ? getMembers() : Promise.resolve({ data: [] as [] }),
  ]

  const [entriesResult, summaryResult, timerResult, membersResult] = await Promise.all(promises)

  // Client-side search filtering (description + task title)
  let entries = entriesResult.data
  if (search) {
    const q = search.toLowerCase()
    entries = entries.filter(
      (e) =>
        e.description?.toLowerCase().includes(q) ||
        e.task?.title?.toLowerCase().includes(q) ||
        e.contact?.first_name?.toLowerCase().includes(q) ||
        e.contact?.last_name?.toLowerCase().includes(q) ||
        e.company?.name?.toLowerCase().includes(q)
    )
  }

  return (
    <div className="p-8 lg:p-12 max-w-[1400px] space-y-6">
      <TimeTrackingPage
        entries={entries}
        summary={summaryResult.data}
        runningTimer={timerResult.data}
        searchQuery={search}
        currentFilter={filter}
        currentView={currentView}
        canViewTeam={canViewTeam}
        members={membersResult.data}
        selectedMemberId={params.member || ""}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />
    </div>
  )
}
