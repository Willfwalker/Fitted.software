import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SubmissionsList } from "@/components/forms/SubmissionsList"
import type { Form, FormSubmission } from "@/lib/types/forms"

export default async function SubmissionsPage({
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

  const { data: submissions } = await supabase
    .from("form_submissions")
    .select("*, contact:contacts(id, first_name, last_name, email), company:companies(id, name), deal:deals(id, title)")
    .eq("form_id", id)
    .eq("org_id", membership.org_id)
    .order("created_at", { ascending: false })

  return (
    <div className="p-6 sm:p-8 lg:p-12 max-w-[1400px] space-y-6">
      <div className="animate-dash-in">
        <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-[var(--accent)] mb-2 block">
          Forms / {form.name}
        </span>
        <h1 className="font-[family-name:var(--font-display)] text-[2.2rem] text-[var(--text)] leading-tight">
          Submissions
        </h1>
      </div>

      <SubmissionsList
        form={form as Form}
        submissions={(submissions ?? []) as FormSubmission[]}
      />
    </div>
  )
}
