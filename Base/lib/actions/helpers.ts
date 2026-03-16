"use server"

import { createClient } from "@/lib/supabase/server"
import type { AppRole } from "@/lib/rbac/permissions"

/**
 * Gets the current user's org_id and role. For use in server actions only.
 */
export async function getOrgId(): Promise<{ orgId: string; userId: string; role: AppRole } | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: memberships } = await supabase
    .from("organization_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .limit(1)

  const orgId = memberships?.[0]?.org_id
  const role = (memberships?.[0]?.role as AppRole) ?? null
  if (!orgId || !role) return null

  return { orgId, userId: user.id, role }
}
