import { Octokit } from "octokit"
import type { ProvisionContext } from "../types"

export async function stepFinalize(ctx: ProvisionContext): Promise<Partial<ProvisionContext>> {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
  const [owner, repo] = ctx.githubRepo!.split("/")

  // Build client.config.json
  const config = {
    businessName: ctx.businessName,
    slug: ctx.slug,
    modules: ctx.modules,
    accentColor: ctx.accentColor,
    customDomain: ctx.customDomain || null,
    supabaseUrl: ctx.supabaseUrl,
    vercelUrl: ctx.vercelUrl,
    provisionedAt: new Date().toISOString(),
  }

  const content = Buffer.from(
    JSON.stringify(config, null, 2),
    "utf-8"
  ).toString("base64")

  // Push client.config.json to the repo
  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: "client.config.json",
    message: "Add client configuration (provisioned by Fitted Software)",
    content,
  })

  // This push triggers the first Vercel deployment automatically

  return {}
}
