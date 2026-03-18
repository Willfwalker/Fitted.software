"use server"

import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "@/lib/actions/helpers"
import { profileSchema } from "@/lib/validations/profile"
import { revalidatePath } from "next/cache"
import type { Profile } from "@/lib/types/profile"

export async function getProfile(): Promise<{ data: Profile | null; error: string | null }> {
  const ctx = await getOrgId()
  if (!ctx) return { data: null, error: "Not authenticated" }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("org_id", ctx.orgId)
    .eq("user_id", ctx.userId)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data: data as Profile | null, error: null }
}

export async function updateProfile(
  input: Record<string, unknown>
): Promise<{ data: Profile | null; error: string | null }> {
  const ctx = await getOrgId()
  if (!ctx) return { data: null, error: "Not authenticated" }

  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        org_id: ctx.orgId,
        user_id: ctx.userId,
        ...parsed.data,
      },
      { onConflict: "org_id,user_id" }
    )
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath("/settings")
  return { data: data as Profile, error: null }
}

export async function uploadAvatar(
  formData: FormData
): Promise<{ url: string | null; error: string | null }> {
  const ctx = await getOrgId()
  if (!ctx) return { url: null, error: "Not authenticated" }

  const file = formData.get("avatar") as File | null
  if (!file) return { url: null, error: "No file provided" }

  if (!file.type.startsWith("image/")) {
    return { url: null, error: "File must be an image" }
  }

  if (file.size > 2 * 1024 * 1024) {
    return { url: null, error: "Image must be under 2MB" }
  }

  const supabase = await createClient()
  const ext = file.name.split(".").pop() ?? "jpg"
  const path = `${ctx.orgId}/${ctx.userId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true })

  if (uploadError) return { url: null, error: uploadError.message }

  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(path)

  const url = urlData.publicUrl

  // Update profile with new avatar URL
  await supabase
    .from("profiles")
    .upsert(
      {
        org_id: ctx.orgId,
        user_id: ctx.userId,
        avatar_url: url,
      },
      { onConflict: "org_id,user_id" }
    )

  revalidatePath("/settings")
  return { url, error: null }
}
