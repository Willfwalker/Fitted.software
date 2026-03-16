"use server"

import { requirePermission } from "@/lib/rbac/require"
import { revalidatePath } from "next/cache"
import crypto from "crypto"

function generateCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase().replace(/(.{4})(.{4})/, "$1-$2")
}

export async function createInviteCode() {
  const { supabase, ctx } = await requirePermission("invite_codes:manage")

  const code = generateCode()
  const { error } = await supabase
    .from("invite_codes")
    .insert({
      org_id: ctx.orgId,
      code,
      created_by: ctx.userId,
    })

  if (error) return { error: error.message }

  revalidatePath("/settings")
  return { data: code }
}

export async function getInviteCodes() {
  const { supabase, ctx } = await requirePermission("invite_codes:manage")

  const { data, error } = await supabase
    .from("invite_codes")
    .select("*")
    .eq("org_id", ctx.orgId)
    .order("created_at", { ascending: false })

  if (error) return { error: error.message, data: [] }
  return { data: data ?? [] }
}

export async function deleteInviteCode(id: string) {
  const { supabase } = await requirePermission("invite_codes:manage")

  const { error } = await supabase
    .from("invite_codes")
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/settings")
  return { success: true }
}
