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

  // 4. Fetch and run the consolidated schema
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
  const ghOrg = process.env.GITHUB_ORG!
  const templateRepo = process.env.GITHUB_TEMPLATE_REPO || "Fitted.software"

  console.log("     Fetching schema_full.sql...")
  const sql = await fetchFileFromRepo(octokit, ghOrg, templateRepo, "Base/supabase/schema_full.sql")
  console.log(`     Running schema_full.sql (${sql.length} chars)...`)

  // Wrap in transaction so it fully succeeds or fully rolls back
  await runSQL(ref, accessToken, `BEGIN;\n${sql}\nCOMMIT;`)

  // Verify the schema was applied
  console.log("     Verifying schema...")
  await runSQL(ref, accessToken, `SELECT 1 FROM public.organizations LIMIT 0;`)

  // Set enabled_modules default to selected modules
  const modulesJson = JSON.stringify(ctx.modules)
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
