import type { ProvisionContext } from "../types"

export async function stepSupabaseAuth(ctx: ProvisionContext): Promise<Partial<ProvisionContext>> {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN!
  const ref = ctx.supabaseRef!

  // Enable email auth provider & configure site URL
  const siteUrl = ctx.customDomain
    ? `https://${ctx.customDomain}`
    : `https://${ctx.vercelUrl || `client-${ctx.slug}.vercel.app`}`

  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      site_url: siteUrl,
      uri_allow_list: `${siteUrl}/**`,
      external_email_enabled: true,
      mailer_autoconfirm: false,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Supabase auth config failed: ${body}`)
  }

  return {}
}
