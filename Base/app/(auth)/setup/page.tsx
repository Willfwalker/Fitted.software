import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SetupForm } from "@/components/auth/SetupForm"

export default async function SetupPage() {
  const supabase = await createClient()
  const { data: orgExists } = await supabase.rpc("org_exists")

  if (orgExists) redirect("/login")

  return <SetupForm />
}
