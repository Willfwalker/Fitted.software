import { cache } from "react"
import { createClient } from "./server"

/**
 * Cached per-request: resolves the authenticated user and their org_id.
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
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)

  const orgId = memberships?.[0]?.org_id
  if (!orgId) return null

  return { supabase, user, orgId }
})
