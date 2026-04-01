import { Octokit } from "octokit"
import type { ProvisionContext } from "../types"
import { runSQL } from "../sql-runner"

export async function stepSupabase(ctx: ProvisionContext): Promise<Partial<ProvisionContext>> {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN!
  const orgId = process.env.SUPABASE_ORG_ID!

  // 1. Create Supabase project
  const createRes = await fetch("https://api.supabase.com/v1/projects", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `fitted-${ctx.slug}`,
      organization_id: orgId,
      region: "us-east-1",
      plan: "free",
      db_pass: generatePassword(),
    }),
  })

  if (!createRes.ok) {
    const body = await createRes.text()
    throw new Error(`Supabase create failed: ${body}`)
  }

  const project = await createRes.json()
  const ref = project.id as string

  // 2. Wait for project to be healthy
  await waitForHealth(ref, accessToken)

  // 3. Get API keys
  const keysRes = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const keys = await keysRes.json()
  const anonKey = keys.find((k: { name: string }) => k.name === "anon")?.api_key
  const serviceKey = keys.find((k: { name: string }) => k.name === "service_role")?.api_key

  if (!anonKey || !serviceKey) throw new Error("Failed to get Supabase API keys")

  const supabaseUrl = `https://${ref}.supabase.co`

  // 4. Fetch and run schemas individually (Management API has query size limits)
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
  const ghOrg = process.env.GITHUB_ORG!
  const templateRepo = process.env.GITHUB_TEMPLATE_REPO || "Fitted.software"

  // List schema and migration files in order
  const schemaFiles = [
    // Core schema
    "Base/supabase/schemas/001_base.sql",
    // RLS fixes (defines get_user_org_ids() used by later schemas)
    "Base/supabase/fixes/001_rls_recursion.sql",
    "Base/supabase/fixes/002_rls_recursion_v2.sql",
    // Feature schemas
    "Base/supabase/schemas/002_crm.sql",
    "Base/supabase/schemas/003_invoicing_tags.sql",
    "Base/supabase/schemas/004_pdf_email_recurring.sql",
    "Base/supabase/schemas/005_tasks.sql",
    "Base/supabase/schemas/006_notifications.sql",
    "Base/supabase/schemas/007_files.sql",
    "Base/supabase/schemas/008_scheduling.sql",
    "Base/supabase/schemas/009_messaging.sql",
    "Base/supabase/schemas/010_forms.sql",
    "Base/supabase/schemas/011_chat.sql",
    "Base/supabase/schemas/012_notification_preferences.sql",
    "Base/supabase/schemas/013_integrations.sql",
    "Base/supabase/schemas/014_time_tracking.sql",
    "Base/supabase/schemas/015_stripe.sql",
    "Base/supabase/schemas/016_client_portal.sql",
    "Base/supabase/schemas/017_email_threads.sql",
    "Base/supabase/schemas/018_automations.sql",
    "Base/supabase/schemas/019_google_calendar.sql",
    "Base/supabase/schemas/020_profiles.sql",
    // Migrations
    "Base/supabase/migrations/001_invoice_enhancements.sql",
    "Base/supabase/migrations/002_enabled_modules.sql",
    "Base/supabase/migrations/003_single_tenant.sql",
    "Base/supabase/migrations/004_get_org_members.sql",
  ]

  for (const file of schemaFiles) {
    const name = file.split("/").pop()!
    console.log(`     Running ${name}...`)
    const sql = await fetchFileFromRepo(octokit, ghOrg, templateRepo, file)
    await runSQL(ref, accessToken, sql)
  }

  // Verify the schema was applied
  await runSQL(ref, accessToken, `SELECT 1 FROM public.organizations LIMIT 0;`)
  console.log("     ✓ Schema verified")

  // Set enabled_modules default to selected modules
  const VALID_MODULES = [
    "crm", "tasks", "calendar", "invoicing", "messaging",
    "files", "forms", "reports", "automations", "time-tracking",
  ]
  const safeModules = (ctx.modules || []).filter(
    (m: string) => VALID_MODULES.includes(m) && /^[a-z-]+$/.test(m)
  )
  const modulesJson = JSON.stringify(safeModules)
  await runSQL(ref, accessToken, `
    ALTER TABLE public.organizations
      ALTER COLUMN enabled_modules SET DEFAULT '${modulesJson}'::jsonb;
  `)

  return {
    supabaseRef: ref,
    supabaseUrl,
    supabaseAnonKey: anonKey,
    supabaseServiceKey: serviceKey,
  }
}

async function fetchFileFromRepo(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string
): Promise<string> {
  const { data } = await octokit.rest.repos.getContent({ owner, repo, path })
  if ("content" in data && data.content) {
    return Buffer.from(data.content, "base64").toString("utf-8")
  }
  throw new Error(`Could not fetch ${path}`)
}

async function waitForHealth(ref: string, token: string) {
  for (let i = 0; i < 60; i++) {
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const project = await res.json()
    if (project.status === "ACTIVE_HEALTHY") return
    await new Promise((r) => setTimeout(r, 5000))
  }
  throw new Error("Supabase project health check timed out (5 minutes)")
}

function generatePassword(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%"
  let pwd = ""
  for (let i = 0; i < 32; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)]
  }
  return pwd
}
