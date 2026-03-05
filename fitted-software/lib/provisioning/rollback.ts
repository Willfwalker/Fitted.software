import { Octokit } from "octokit"
import type { ProvisionContext } from "./types"

/**
 * Best-effort rollback of partially provisioned resources.
 */
export async function rollback(ctx: ProvisionContext): Promise<void> {
  const errors: string[] = []

  // 1. Delete Vercel project
  if (ctx.vercelProjectId) {
    try {
      const token = process.env.VERCEL_TOKEN!
      const teamId = process.env.VERCEL_TEAM_ID
      const tp = teamId ? `?teamId=${teamId}` : ""
      await fetch(
        `https://api.vercel.com/v9/projects/${ctx.vercelProjectId}${tp}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      )
    } catch (err) {
      errors.push(`Vercel: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // 2. Delete (pause) Supabase project
  if (ctx.supabaseRef) {
    try {
      const accessToken = process.env.SUPABASE_ACCESS_TOKEN!
      // Supabase API doesn't allow direct delete — pause instead
      await fetch(`https://api.supabase.com/v1/projects/${ctx.supabaseRef}/pause`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    } catch (err) {
      errors.push(`Supabase: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // 3. Delete GitHub repo
  if (ctx.githubRepo) {
    try {
      const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
      const [owner, repo] = ctx.githubRepo.split("/")
      await octokit.rest.repos.delete({ owner, repo })
    } catch (err) {
      errors.push(`GitHub: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  if (errors.length > 0) {
    console.error("Rollback errors:", errors)
  }
}
