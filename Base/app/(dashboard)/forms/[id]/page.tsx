import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FormBuilder } from "@/components/forms/FormBuilder"
import type { Form } from "@/lib/types/forms"

export default async function FormEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: membership } = await supabase
    .from("organization_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .single()

  if (!membership) redirect("/login")

  const { data: form } = await supabase
    .from("forms")
    .select("*")
    .eq("id", id)
    .eq("org_id", membership.org_id)
    .single()

  if (!form) notFound()

  return (
    <div className="p-6 sm:p-8 lg:p-12 max-w-[1400px] space-y-6">
      <FormBuilder form={form as Form} />
    </div>
  )
}
