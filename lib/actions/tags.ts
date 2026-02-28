"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "./helpers"
import { tagSchema } from "@/lib/validations/crm"

export type TagActionState = {
  error?: string
  success?: boolean
}

export async function createTag(
  _prev: TagActionState,
  formData: FormData
): Promise<TagActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const raw = Object.fromEntries(formData)
  const parsed = tagSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()

  const { error } = await supabase.from("tags").insert({
    org_id: ctx.orgId,
    name: parsed.data.name,
    color: parsed.data.color,
  })

  if (error) {
    if (error.message.includes("duplicate")) return { error: "A tag with this name already exists" }
    return { error: error.message }
  }

  revalidatePath("/dashboard/settings")
  return { success: true }
}

export async function updateTag(
  id: string,
  _prev: TagActionState,
  formData: FormData
): Promise<TagActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const raw = Object.fromEntries(formData)
  const parsed = tagSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()

  const { error } = await supabase
    .from("tags")
    .update({ name: parsed.data.name, color: parsed.data.color })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/dashboard/settings")
  return { success: true }
}

export async function deleteTag(id: string): Promise<TagActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase.from("tags").delete().eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/dashboard/settings")
  return { success: true }
}

export async function addTagToEntity(
  tagId: string,
  entityType: "contact" | "company" | "deal",
  entityId: string
): Promise<TagActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase.from("entity_tags").insert({
    tag_id: tagId,
    entity_type: entityType,
    entity_id: entityId,
  })

  if (error) {
    if (error.message.includes("duplicate")) return { success: true }
    return { error: error.message }
  }

  return { success: true }
}

export async function removeTagFromEntity(
  tagId: string,
  entityType: "contact" | "company" | "deal",
  entityId: string
): Promise<TagActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("entity_tags")
    .delete()
    .eq("tag_id", tagId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)

  if (error) return { error: error.message }

  return { success: true }
}

export async function getEntityTags(
  entityType: "contact" | "company" | "deal",
  entityId: string
) {
  const ctx = await getOrgId()
  if (!ctx) return []

  const supabase = await createClient()

  const { data } = await supabase
    .from("entity_tags")
    .select("id, tag_id, entity_type, entity_id, tag:tags(id, name, color)")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)

  return (data ?? []).map((et) => ({
    ...et,
    tag: et.tag as unknown as { id: string; name: string; color: string },
  }))
}
