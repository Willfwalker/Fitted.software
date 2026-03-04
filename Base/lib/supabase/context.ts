import { createClient } from "./server"

/**
 * For server components: gets the supabase client, user, and org_id.
 * NOT a server action — safe to return non-serializable objects like the supabase client.
 */
export async function getServerContext() {
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
}
