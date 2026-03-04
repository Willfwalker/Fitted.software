import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { CommandKModal } from "@/components/search/CommandKModal"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Get user's organization
  const { data: membership } = await supabase
    .from("organization_members")
    .select("org_id, role, organizations(name)")
    .eq("user_id", user.id)
    .limit(1)
    .single()

  const meta = user.user_metadata ?? {}
  const orgName =
    meta.org_name ?? meta.company_name ?? meta.company ?? "My Agency"

  const userName =
    user.user_metadata?.full_name ?? user.user_metadata?.name ?? null
  const userEmail = user.email

  return (
    <>
      <DashboardShell
        orgName={orgName}
        userName={userName}
        userEmail={userEmail}
      >
        {children}
      </DashboardShell>
      <CommandKModal />
    </>
  )
}
