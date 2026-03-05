import type { ProvisionContext } from "../types"

function teamParam(): string {
  const teamId = process.env.VERCEL_TEAM_ID
  return teamId ? `?teamId=${teamId}` : ""
}

export async function stepVercel(ctx: ProvisionContext): Promise<Partial<ProvisionContext>> {
  const token = process.env.VERCEL_TOKEN!
  const ghOrg = process.env.GITHUB_ORG!

  const projectName = `client-${ctx.slug}`

  // 1. Create Vercel project linked to GitHub repo
  const createRes = await fetch(`https://api.vercel.com/v10/projects${teamParam()}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: projectName,
      framework: "nextjs",
      gitRepository: {
        type: "github",
        repo: `${ghOrg}/${projectName}`,
      },
      rootDirectory: null,
      buildCommand: "npm run build",
      outputDirectory: ".next",
    }),
  })

  if (!createRes.ok) {
    const body = await createRes.text()
    throw new Error(`Vercel project creation failed: ${body}`)
  }

  const project = await createRes.json()
  const vercelProjectId = project.id as string
  const vercelUrl = `${projectName}.vercel.app`

  // 2. Set environment variables
  const cronSecret = crypto.randomUUID()
  const appUrl = ctx.customDomain
    ? `https://${ctx.customDomain}`
    : `https://${vercelUrl}`

  const envVars = [
    { key: "NEXT_PUBLIC_SUPABASE_URL", value: ctx.supabaseUrl! },
    { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", value: ctx.supabaseAnonKey! },
    { key: "SUPABASE_SERVICE_ROLE_KEY", value: ctx.supabaseServiceKey! },
    { key: "RESEND_API_KEY", value: process.env.SHARED_RESEND_API_KEY || "" },
    { key: "RESEND_DOMAIN", value: process.env.SHARED_RESEND_DOMAIN || "resend.dev" },
    { key: "NEXT_PUBLIC_APP_URL", value: appUrl },
    { key: "CRON_SECRET", value: cronSecret },
  ]

  for (const env of envVars) {
    await fetch(`https://api.vercel.com/v10/projects/${vercelProjectId}/env${teamParam()}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: env.key,
        value: env.value,
        type: env.key.startsWith("NEXT_PUBLIC_") ? "plain" : "encrypted",
        target: ["production", "preview"],
      }),
    })
  }

  return { vercelProjectId, vercelUrl }
}
