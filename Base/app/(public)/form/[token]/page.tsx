import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { PublicFormView } from "@/components/forms/PublicFormView"
import type { Form } from "@/lib/types/forms"

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data: form } = await supabase
    .from("forms")
    .select("*")
    .eq("share_token", token)
    .eq("status", "ACTIVE")
    .single()

  if (!form) notFound()

  // Get org name
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", form.org_id)
    .single()

  return (
    <PublicFormView
      form={form as Form}
      orgName={org?.name ?? "Company"}
      shareToken={token}
    />
  )
}
