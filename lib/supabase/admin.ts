import { createClient } from "@supabase/supabase-js"

/**
 * Service-role client that bypasses RLS.
 * Use ONLY in API routes / server actions where the user is verified
 * by other means (e.g. share_token, cron secret).
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
