"use server"

import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "./helpers"
import { revalidatePath } from "next/cache"
import crypto from "crypto"

function generateCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase().replace(/(.{4})(.{4})/, "$1-$2")
}

async function requireAdmin() {
  const supabase = await createClient()
  const ctx = await getOrgId()
  if (!ctx) throw new Error("Not authenticated")

  const { data: member } = await supabase
    .from("organization_members")
    .select("role")
    .eq("org_id", ctx.orgId)
    .eq("user_id", ctx.userId)
    .single()

  if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
    throw new Error("Insufficient permissions")
  }

  return { supabase, ctx }
}

export async function createInviteCode() {
  const { supabase, ctx } = await requireAdmin()

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
  const { supabase, ctx } = await requireAdmin()

  const { data, error } = await supabase
    .from("invite_codes")
    .select("*")
    .eq("org_id", ctx.orgId)
    .order("created_at", { ascending: false })

  if (error) return { error: error.message, data: [] }
  return { data: data ?? [] }
}

export async function deleteInviteCode(id: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from("invite_codes")
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/settings")
  return { success: true }
}
