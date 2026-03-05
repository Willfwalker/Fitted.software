/**
 * Teardown a provisioned client by slug.
 *
 * Usage: npx tsx scripts/teardown.ts <slug>
 *
 * Deletes: GitHub repo, pauses Supabase project, deletes Vercel project,
 * removes the record from provisioned_clients.
 */

import { Octokit } from "octokit"
import { createClient } from "@supabase/supabase-js"
import "dotenv/config"

const slug = process.argv[2]
if (!slug) {
  console.error("Usage: npx tsx scripts/teardown.ts <slug>")
  process.exit(1)
}

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Get the client record
  const { data: client, error } = await supabase
    .from("provisioned_clients")
    .select("*")
    .eq("slug", slug)
    .single()

  if (error || !client) {
    console.error(`Client "${slug}" not found`)
    process.exit(1)
  }

  console.log(`Tearing down: ${client.business_name} (${slug})`)
  console.log(`  Status: ${client.status}`)

  // 2. Delete Vercel project
  if (client.vercel_project_id) {
    console.log(`  Deleting Vercel project: ${client.vercel_project_id}`)
    try {
      const teamId = process.env.VERCEL_TEAM_ID
      const tp = teamId ? `?teamId=${teamId}` : ""
      const res = await fetch(
        `https://api.vercel.com/v9/projects/${client.vercel_project_id}${tp}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}` },
        }
      )
      console.log(`    → ${res.ok ? "deleted" : `failed (${res.status})`}`)
    } catch (err) {
      console.log(`    → error: ${err}`)
    }
  }

  // 3. Delete/pause Supabase project
  if (client.supabase_ref) {
    console.log(`  Deleting Supabase project: ${client.supabase_ref}`)
    try {
      // Try delete first (removes project entirely)
      const res = await fetch(
        `https://api.supabase.com/v1/projects/${client.supabase_ref}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}` },
        }
      )
      if (res.ok) {
        console.log("    → deleted")
      } else {
        // Fall back to pause
        const pauseRes = await fetch(
          `https://api.supabase.com/v1/projects/${client.supabase_ref}/pause`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}` },
          }
        )
        console.log(`    → ${pauseRes.ok ? "paused" : `failed (${pauseRes.status})`}`)
      }
    } catch (err) {
      console.log(`    → error: ${err}`)
    }
  }

  // 4. Delete GitHub repo
  if (client.github_repo) {
    console.log(`  Deleting GitHub repo: ${client.github_repo}`)
    try {
      const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
      const [owner, repo] = client.github_repo.split("/")
      await octokit.rest.repos.delete({ owner, repo })
      console.log("    → deleted")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`    → error: ${msg}`)
    }
  }

  // 5. Remove record from provisioned_clients
  console.log("  Removing database record...")
  const { error: delError } = await supabase
    .from("provisioned_clients")
    .delete()
    .eq("id", client.id)

  if (delError) {
    console.log(`    → error: ${delError.message}`)
  } else {
    console.log("    → removed")
  }

  console.log("\nDone.")
}

main().catch(console.error)
