import { Octokit } from "octokit"
import type { ProvisionContext } from "../types"

export async function stepGithub(ctx: ProvisionContext): Promise<Partial<ProvisionContext>> {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
  const owner = process.env.GITHUB_ORG!
  const sourceRepo = process.env.GITHUB_TEMPLATE_REPO || "Fitted.software"
  const repoName = `client-${ctx.slug}`

  // 1. Generate repo from template (~2-5s, all server-side)
  await octokit.rest.repos.createUsingTemplate({
    template_owner: owner,
    template_repo: sourceRepo,
    owner,
    name: repoName,
    private: true,
    description: `Fitted instance for ${ctx.businessName}`,
  })

  // 2. Wait for generation to complete, then get main ref
  let mainRef
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      const { data } = await octokit.rest.git.getRef({
        owner,
        repo: repoName,
        ref: "heads/main",
      })
      mainRef = data
      break
    } catch {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }
  if (!mainRef) throw new Error("Timed out waiting for template repo generation")

  // 3. Get commit tree to find Base/ subtree
  const { data: commit } = await octokit.rest.git.getCommit({
    owner,
    repo: repoName,
    commit_sha: mainRef.object.sha,
  })

  const { data: rootTree } = await octokit.rest.git.getTree({
    owner,
    repo: repoName,
    tree_sha: commit.tree.sha,
  })

  const baseEntry = rootTree.tree.find((t) => t.path === "Base" && t.type === "tree")
  if (!baseEntry?.sha) throw new Error("Base/ directory not found in generated repo")

  // 4. Create new commit with Base/ as root tree (flattens the monorepo)
  const { data: newCommit } = await octokit.rest.git.createCommit({
    owner,
    repo: repoName,
    message: "Initial commit — provisioned by Fitted Software",
    tree: baseEntry.sha,
    parents: [mainRef.object.sha],
  })

  // 5. Update main to point to flattened commit
  await octokit.rest.git.updateRef({
    owner,
    repo: repoName,
    ref: "heads/main",
    sha: newCommit.sha,
    force: true,
  })

  return { githubRepo: `${owner}/${repoName}` }
}
