"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "./helpers"
import { notifyOrgMembers } from "./notifications"
import type { FormSubmission } from "@/lib/types/forms"

export type SubmissionActionState = {
  error?: string
  success?: boolean
  submissionId?: string
}

export async function listSubmissions(
  formId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ data: FormSubmission[]; error?: string }> {
  const ctx = await getOrgId()
  if (!ctx) return { data: [], error: "Not authenticated" }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("form_submissions")
    .select("*, contact:contacts(id, first_name, last_name, email), company:companies(id, name), deal:deals(id, title)")
    .eq("form_id", formId)
    .eq("org_id", ctx.orgId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return { data: [], error: error.message }

  return { data: (data ?? []) as FormSubmission[] }
}

export async function deleteSubmission(id: string): Promise<SubmissionActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("form_submissions")
    .delete()
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/forms")
  return { success: true }
}

export async function linkSubmissionToContact(
  submissionId: string,
  contactId: string
): Promise<SubmissionActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("form_submissions")
    .update({ contact_id: contactId })
    .eq("id", submissionId)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/forms")
  return { success: true }
}

/**
 * Called internally after a public form submission to notify the form owner
 * and log an activity. Not a form action — called from the API route.
 */
export async function processSubmissionNotification(
  formId: string,
  formName: string,
  orgId: string,
  createdBy: string,
  submissionId: string
) {
  await notifyOrgMembers({
    orgId,
    performerUserId: createdBy,
    category: "form_submission",
    title: "New form submission",
    body: `Someone submitted "${formName}"`,
    link: `/forms/${formId}/submissions`,
    icon: "ClipboardList",
    sourceType: "form_submission",
    sourceId: submissionId,
  })
}
