"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "./helpers"
import { formSchema } from "@/lib/validations/forms"
import type { Form } from "@/lib/types/forms"

export type FormActionState = {
  error?: string
  success?: boolean
  formId?: string
  shareToken?: string
}

export async function createForm(
  data: {
    name: string
    description?: string
    slug?: string
    fields?: unknown[]
    settings?: Record<string, unknown>
  }
): Promise<FormActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const parsed = formSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const d = parsed.data
  const supabase = await createClient()

  const { data: form, error } = await supabase
    .from("forms")
    .insert({
      org_id: ctx.orgId,
      name: d.name,
      description: d.description || null,
      slug: d.slug || null,
      fields: d.fields,
      settings: d.settings,
      created_by: ctx.userId,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  revalidatePath("/forms")
  return { success: true, formId: form.id }
}

export async function updateForm(
  id: string,
  data: {
    name: string
    description?: string
    slug?: string
    fields?: unknown[]
    settings?: Record<string, unknown>
  }
): Promise<FormActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const parsed = formSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const d = parsed.data
  const supabase = await createClient()

  const { error } = await supabase
    .from("forms")
    .update({
      name: d.name,
      description: d.description || null,
      slug: d.slug || null,
      fields: d.fields,
      settings: d.settings,
    })
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/forms")
  revalidatePath(`/forms/${id}`)
  return { success: true }
}

export async function deleteForm(id: string): Promise<FormActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("forms")
    .delete()
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/forms")
  return { success: true }
}

export async function publishForm(id: string): Promise<FormActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("forms")
    .update({ status: "ACTIVE" })
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/forms")
  revalidatePath(`/forms/${id}`)
  return { success: true }
}

export async function archiveForm(id: string): Promise<FormActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("forms")
    .update({ status: "ARCHIVED" })
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/forms")
  revalidatePath(`/forms/${id}`)
  return { success: true }
}

export async function unpublishForm(id: string): Promise<FormActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("forms")
    .update({ status: "DRAFT" })
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/forms")
  revalidatePath(`/forms/${id}`)
  return { success: true }
}

export async function generateShareToken(id: string): Promise<FormActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  // Check if token already exists
  const { data: existing } = await supabase
    .from("forms")
    .select("share_token")
    .eq("id", id)
    .eq("org_id", ctx.orgId)
    .single()

  if (existing?.share_token) {
    return { success: true, shareToken: existing.share_token }
  }

  const token = crypto.randomUUID()
  const { error } = await supabase
    .from("forms")
    .update({ share_token: token })
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  return { success: true, shareToken: token }
}

export async function getForms(): Promise<{ data: Form[]; error?: string }> {
  const ctx = await getOrgId()
  if (!ctx) return { data: [], error: "Not authenticated" }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("forms")
    .select("*")
    .eq("org_id", ctx.orgId)
    .order("created_at", { ascending: false })

  if (error) return { data: [], error: error.message }

  return { data: (data ?? []) as Form[] }
}

export async function getForm(id: string): Promise<{ data: Form | null; error?: string }> {
  const ctx = await getOrgId()
  if (!ctx) return { data: null, error: "Not authenticated" }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("forms")
    .select("*")
    .eq("id", id)
    .eq("org_id", ctx.orgId)
    .single()

  if (error) return { data: null, error: error.message }

  return { data: data as Form }
}
