import { redirect } from "next/navigation"
import { getServerContext } from "@/lib/supabase/context"
import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { CommandKModal } from "@/components/search/CommandKModal"
import { DEFAULT_ENABLED_MODULES, type ModuleKey } from "@/lib/config/modules"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await getServerContext()
  if (!ctx) redirect("/login")

  const { supabase, user, orgId } = ctx
  const meta = user.user_metadata ?? {}
  const orgName =
    meta.org_name ?? meta.company_name ?? meta.company ?? "My Agency"

  const userName =
    user.user_metadata?.full_name ?? user.user_metadata?.name ?? null
  const userEmail = user.email

  // Fetch org's enabled modules
  let enabledModules: ModuleKey[] = DEFAULT_ENABLED_MODULES
  const { data: org } = await supabase
    .from("organizations")
    .select("enabled_modules")
    .eq("id", orgId)
    .single()

  if (org?.enabled_modules && Array.isArray(org.enabled_modules)) {
    enabledModules = org.enabled_modules as ModuleKey[]
  }

  return (
    <>
      <DashboardShell
        orgName={orgName}
        userName={userName}
        userEmail={userEmail}
        enabledModules={enabledModules}
      >
        {children}
      </DashboardShell>
      <CommandKModal />
    </>
  )
}
