"use server"

import { createClient } from "@/lib/supabase/server"

/**
 * Gets the current user's org_id. For use in server actions only.
 */
export async function getOrgId(): Promise<{ orgId: string; userId: string } | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: memberships } = await supabase
    .from("organization_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)

  const orgId = memberships?.[0]?.org_id
  if (!orgId) return null

  return { orgId, userId: user.id }
}
