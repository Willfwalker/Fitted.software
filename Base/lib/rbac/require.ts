"use server"

import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "@/lib/actions/helpers"
import { hasPermission, type Permission } from "./permissions"

export async function requirePermission(permission: Permission) {
  const ctx = await getOrgId()
  if (!ctx) throw new Error("Not authenticated")

  if (!hasPermission(ctx.role, permission)) {
    throw new Error("Insufficient permissions")
  }

  const supabase = await createClient()
  return { supabase, ctx }
}
