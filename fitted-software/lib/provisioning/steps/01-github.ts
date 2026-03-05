import { Octokit } from "octokit"
import type { ProvisionContext } from "../types"

export async function stepGithub(ctx: ProvisionContext): Promise<Partial<ProvisionContext>> {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
  const owner = process.env.GITHUB_ORG!
  const sourceRepo = process.env.GITHUB_TEMPLATE_REPO || "Fitted.software"
  const repoName = `client-${ctx.slug}`

  // 1. Create repo with auto_init so it's not empty
  await octokit.rest.repos.createForAuthenticatedUser({
    name: repoName,
    private: true,
    description: `Fitted instance for ${ctx.businessName}`,
    auto_init: true,
  })

  // Wait for the init commit to be ready
  await sleep(3000)

  // 2. Get the latest commit on main of the SOURCE repo
  const { data: srcRef } = await octokit.rest.git.getRef({
    owner,
    repo: sourceRepo,
    ref: "heads/main",
  })

  const { data: srcCommit } = await octokit.rest.git.getCommit({
    owner,
    repo: sourceRepo,
    commit_sha: srcRef.object.sha,
  })

  // 3. Find the Base/ subtree in the source repo
  const { data: rootTree } = await octokit.rest.git.getTree({
    owner,
    repo: sourceRepo,
    tree_sha: srcCommit.tree.sha,
  })

  const baseEntry = rootTree.tree.find((t) => t.path === "Base" && t.type === "tree")
  if (!baseEntry?.sha) throw new Error("Base/ directory not found in source repo")

  // 4. Get full Base/ tree recursively
  const { data: baseTree } = await octokit.rest.git.getTree({
    owner,
    repo: sourceRepo,
    tree_sha: baseEntry.sha,
    recursive: "true",
  })

  // 5. Copy each blob from source to new repo
  const newTreeItems: { path: string; mode: string; type: string; sha: string }[] = []

  for (const item of baseTree.tree) {
    if (item.type === "blob" && item.sha && item.path && item.mode) {
      const { data: blob } = await octokit.rest.git.getBlob({
        owner,
        repo: sourceRepo,
        file_sha: item.sha,
      })

      const { data: newBlob } = await octokit.rest.git.createBlob({
        owner,
        repo: repoName,
        content: blob.content,
        encoding: blob.encoding,
      })

      newTreeItems.push({
        path: item.path,
        mode: item.mode as "100644",
        type: "blob",
        sha: newBlob.sha,
      })
    }
  }

  // 6. Create tree in new repo
  const { data: newTree } = await octokit.rest.git.createTree({
    owner,
    repo: repoName,
    tree: newTreeItems as Parameters<typeof octokit.rest.git.createTree>[0]["tree"],
  })

  // 7. Get the current main ref of the new repo (the auto_init commit)
  const { data: newRef } = await octokit.rest.git.getRef({
    owner,
    repo: repoName,
    ref: "heads/main",
  })

  // 8. Create commit with the Base tree, parented on the init commit
  const { data: newCommit } = await octokit.rest.git.createCommit({
    owner,
    repo: repoName,
    message: "Initial commit — provisioned by Fitted Software",
    tree: newTree.sha,
    parents: [newRef.object.sha],
  })

  // 9. Update main to point to our new commit
  await octokit.rest.git.updateRef({
    owner,
    repo: repoName,
    ref: "heads/main",
    sha: newCommit.sha,
    force: true,
  })

  return { githubRepo: `${owner}/${repoName}` }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
