import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardEditorial } from "@/components/dashboard/DashboardEditorial"

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

  return <DashboardEditorial userId={user.id} orgId={orgId} />
}
