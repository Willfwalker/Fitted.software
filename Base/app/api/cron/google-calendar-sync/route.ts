import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { pullEventsFromGoogle } from "@/lib/actions/google-calendar"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Cron job: pull events from Google Calendar for all connected users.
 * Runs every 15 minutes via Vercel cron.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this automatically)
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getAdminClient()

  // Get all enabled Google Calendar integrations
  const { data: integrations } = await supabase
    .from("integrations")
    .select("user_id, org_id")
    .eq("provider", "google_calendar")
    .eq("enabled", true)

  if (!integrations || integrations.length === 0) {
    return NextResponse.json({ synced: 0 })
  }

  let totalImported = 0

  for (const integration of integrations) {
    try {
      const { imported } = await pullEventsFromGoogle(
        integration.user_id,
        integration.org_id
      )
      totalImported += imported
    } catch (err) {
      console.error(`Google sync failed for user ${integration.user_id}:`, err)
    }
  }

  return NextResponse.json({
    synced: integrations.length,
    imported: totalImported,
  })
}
