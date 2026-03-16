import { cache } from "react"
import { createClient } from "./server"
import type { AppRole } from "@/lib/rbac/permissions"

/**
 * Cached per-request: resolves the authenticated user and their org_id + role.
 * React.cache() deduplicates across layout + page in the same render pass.
 */
export const getServerContext = cache(async () => {
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

  return { supabase, user, orgId, role }
})
