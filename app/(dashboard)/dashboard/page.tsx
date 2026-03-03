import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getDefaultWorkspacePage, getBlocksForPage } from "@/lib/workspace/queries"
import { WorkspacePage } from "@/components/workspace/WorkspacePage"
import { DashboardFallback } from "@/components/dashboard/DashboardFallback"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: membership } = await supabase
    .from("organization_members")
    .select("org_id, role, organizations(name)")
    .eq("user_id", user.id)
    .limit(1)
    .single()

  const orgId = membership?.org_id

  if (!orgId) redirect("/login")

  // Check for workspace default page
  const defaultPage = await getDefaultWorkspacePage(orgId)

  if (defaultPage) {
    const blocks = await getBlocksForPage(defaultPage.id)

    const greeting = getGreeting()
    const firstName =
      user.user_metadata?.full_name?.split(" ")[0] ??
      user.user_metadata?.name?.split(" ")[0] ??
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

        <WorkspacePage page={defaultPage} blocks={blocks} orgId={orgId} />
      </div>
    )
  }

  // Fallback: original hardcoded dashboard
  return <DashboardFallback userId={user.id} orgId={orgId} />
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}
