/**
 * Tear down ALL provisioned clients.
 *
 * Usage: npx tsx scripts/teardown-all.ts [--yes]
 *
 * For every row in provisioned_clients, deletes the Vercel project,
 * deletes (or pauses) the Supabase project, deletes the GitHub repo,
 * and removes the DB record. Requires --yes to skip the confirmation prompt.
 */

import { createClient } from "@supabase/supabase-js"
import readline from "node:readline/promises"
import { stdin as input, stdout as output } from "node:process"
import { config as loadEnv } from "dotenv"
loadEnv({ path: ".env.local" })

const autoConfirm = process.argv.includes("--yes") || process.argv.includes("-y")

async function confirm(count: number): Promise<boolean> {
  if (autoConfirm) return true
  const rl = readline.createInterface({ input, output })
  const answer = await rl.question(
    `\nAbout to tear down ${count} client(s). Type "DELETE" to confirm: `
  )
  rl.close()
  return answer.trim() === "DELETE"
}

async function teardownVercel(projectId: string) {
  const teamId = process.env.VERCEL_TEAM_ID
  const tp = teamId ? `?teamId=${teamId}` : ""
  const res = await fetch(
    `https://api.vercel.com/v9/projects/${projectId}${tp}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}` },
    }
  )
  return res.ok ? "deleted" : `failed (${res.status})`
}

async function teardownSupabase(ref: string) {
  const auth = { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}` }
  const del = await fetch(`https://api.supabase.com/v1/projects/${ref}`, {
    method: "DELETE",
    headers: auth,
  })
  if (del.ok) return "deleted"
  const pause = await fetch(`https://api.supabase.com/v1/projects/${ref}/pause`, {
    method: "POST",
    headers: auth,
  })
  return pause.ok ? "paused" : `failed (${del.status}/${pause.status})`
}

async function teardownGithub(repoFullName: string) {
  const res = await fetch(`https://api.github.com/repos/${repoFullName}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  })
  if (res.ok) return "deleted"
  const body = await res.text()
  return `failed (${res.status}: ${body.slice(0, 120)})`
}

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: clients, error } = await supabase
    .from("provisioned_clients")
    .select("*")
    .order("created_at", { ascending: true })

  if (error) {
    console.error(`Failed to list clients: ${error.message}`)
    process.exit(1)
  }
  if (!clients || clients.length === 0) {
    console.log("No provisioned clients found.")
    return
  }

  console.log(`Found ${clients.length} client(s):`)
  for (const c of clients) {
    console.log(`  - ${c.slug.padEnd(30)} [${c.status}]  ${c.business_name}`)
  }

  if (!(await confirm(clients.length))) {
    console.log("Aborted.")
    return
  }

  let ok = 0
  let failed = 0

  for (const client of clients) {
    console.log(`\n▶ ${client.slug} (${client.business_name})`)

    if (client.vercel_project_id) {
      try {
        const r = await teardownVercel(client.vercel_project_id)
        console.log(`  vercel   → ${r}`)
      } catch (err) {
        console.log(`  vercel   → error: ${err instanceof Error ? err.message : err}`)
      }
    }

    if (client.supabase_ref) {
      try {
        const r = await teardownSupabase(client.supabase_ref)
        console.log(`  supabase → ${r}`)
      } catch (err) {
        console.log(`  supabase → error: ${err instanceof Error ? err.message : err}`)
      }
    }

    if (client.github_repo) {
      try {
        const r = await teardownGithub(client.github_repo)
        console.log(`  github   → ${r}`)
      } catch (err) {
        console.log(`  github   → error: ${err instanceof Error ? err.message : err}`)
      }
    }

    const { error: delError } = await supabase
      .from("provisioned_clients")
      .delete()
      .eq("id", client.id)

    if (delError) {
      console.log(`  db       → error: ${delError.message}`)
      failed++
    } else {
      console.log(`  db       → removed`)
      ok++
    }
  }

  console.log(`\nDone. ${ok} removed, ${failed} failed.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
