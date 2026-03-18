import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Google Calendar OAuth2 callback.
 * Exchanges authorization code for tokens and stores in integrations table.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error || !code) {
    const url = request.nextUrl.clone()
    url.pathname = "/settings"
    url.searchParams.set("error", error || "No authorization code")
    return NextResponse.redirect(url)
  }

  // Exchange code for tokens
  const params = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    grant_type: "authorization_code",
  })

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  })

  if (!tokenRes.ok) {
    const url = request.nextUrl.clone()
    url.pathname = "/settings"
    url.searchParams.set("error", "Failed to exchange code for tokens")
    return NextResponse.redirect(url)
  }

  const tokens = await tokenRes.json()
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // Get org ID
  const { data: membership } = await supabase
    .from("organization_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .single()

  if (!membership) {
    const url = request.nextUrl.clone()
    url.pathname = "/settings"
    url.searchParams.set("error", "No organization found")
    return NextResponse.redirect(url)
  }

  // Upsert integration
  await supabase.from("integrations").upsert(
    {
      org_id: membership.org_id,
      user_id: user.id,
      provider: "google_calendar",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      token_expiry: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
      config: { calendar_id: "primary" },
      enabled: true,
    },
    { onConflict: "org_id,user_id,provider" }
  )

  // Redirect to settings with success
  const url = request.nextUrl.clone()
  url.pathname = "/settings"
  url.search = "?google_calendar=connected"
  return NextResponse.redirect(url)
}
