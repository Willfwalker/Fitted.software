"use server"

import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "./helpers"
import { requirePermission } from "@/lib/rbac/require"
import { revalidatePath } from "next/cache"
import type { AppRole } from "@/lib/rbac/permissions"
import type { OrgMember } from "@/lib/types/members"

export async function getMembers(): Promise<{ data: OrgMember[]; error?: string }> {
  const ctx = await getOrgId()
  if (!ctx) return { data: [], error: "Not authenticated" }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_org_members", {
    target_org_id: ctx.orgId,
  })

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as OrgMember[] }
}

export async function updateMemberRole(
  memberId: string,
  newRole: AppRole
): Promise<{ error?: string }> {
  const { supabase, ctx } = await requirePermission("members:manage")

  // Cannot promote to OWNER
  if (newRole === "OWNER") {
    return { error: "Cannot promote to OWNER" }
  }

  // Fetch the target member
  const { data: target } = await supabase
    .from("organization_members")
    .select("user_id, role")
    .eq("id", memberId)
    .eq("org_id", ctx.orgId)
    .single()

  if (!target) return { error: "Member not found" }

  // Cannot change OWNER's role
  if (target.role === "OWNER") {
    return { error: "Cannot change OWNER's role" }
  }

  // ADMIN cannot promote to OWNER (already blocked above) or change other ADMINs if they're not OWNER
  if (ctx.role === "ADMIN" && target.role === "ADMIN") {
    return { error: "ADMINs cannot change other ADMINs' roles" }
  }

  const { error } = await supabase
    .from("organization_members")
    .update({ role: newRole })
    .eq("id", memberId)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/settings")
  return {}
}

export async function removeMember(memberId: string): Promise<{ error?: string }> {
  const { supabase, ctx } = await requirePermission("members:manage")

  // Fetch the target member
  const { data: target } = await supabase
    .from("organization_members")
    .select("user_id, role")
    .eq("id", memberId)
    .eq("org_id", ctx.orgId)
    .single()

  if (!target) return { error: "Member not found" }

  // Cannot remove OWNER
  if (target.role === "OWNER") {
    return { error: "Cannot remove the OWNER" }
  }

  // Cannot remove self
  if (target.user_id === ctx.userId) {
    return { error: "Cannot remove yourself" }
  }

  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("id", memberId)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/settings")
  return {}
}
