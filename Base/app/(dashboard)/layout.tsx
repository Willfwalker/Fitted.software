import { redirect } from "next/navigation"
import { getServerContext } from "@/lib/supabase/context"
import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { CommandKModal } from "@/components/search/CommandKModal"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await getServerContext()
  if (!ctx) redirect("/login")

  const { user } = ctx
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
