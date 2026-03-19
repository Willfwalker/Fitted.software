import { Octokit } from "octokit";
import { createClient } from "@supabase/supabase-js";

const octokit = new Octokit({ auth: process.env.PROPAGATION_TOKEN });
const supabase = createClient(
  process.env.FITTED_SOFTWARE_SUPABASE_URL,
  process.env.FITTED_SOFTWARE_SUPABASE_SERVICE_KEY
);

const OWNER = "Willfwalker";
const SOURCE_REPO = "Fitted.software";
const today = new Date().toISOString().split("T")[0]; // e.g. 2026-03-17
const BRANCH_NAME = `template-update/${today}`;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getBaseTree() {
  // Get latest main commit on the template repo
  const { data: ref } = await octokit.rest.git.getRef({
    owner: OWNER,
    repo: SOURCE_REPO,
    ref: "heads/main",
  });

  const { data: commit } = await octokit.rest.git.getCommit({
    owner: OWNER,
    repo: SOURCE_REPO,
    commit_sha: ref.object.sha,
  });

  // Find the Base/ subtree
  const { data: rootTree } = await octokit.rest.git.getTree({
    owner: OWNER,
    repo: SOURCE_REPO,
    tree_sha: commit.tree.sha,
  });

  const baseEntry = rootTree.tree.find(
    (t) => t.path === "Base" && t.type === "tree"
  );
  if (!baseEntry?.sha) throw new Error("Base/ directory not found in source repo");

  // Get full Base/ tree recursively
  const { data: baseTree } = await octokit.rest.git.getTree({
    owner: OWNER,
    repo: SOURCE_REPO,
    tree_sha: baseEntry.sha,
    recursive: "true",
  });

  return baseTree.tree.filter(
    (item) => item.type === "blob" && item.sha && item.path && item.mode
  );
}

async function getActiveClients() {
  const { data, error } = await supabase
    .from("provisioned_clients")
    .select("slug, business_name, github_repo")
    .eq("status", "active");

  if (error) throw new Error(`Supabase query failed: ${error.message}`);
  if (!data?.length) {
    console.log("No active clients found. Nothing to propagate.");
    return [];
  }

  console.log(`Found ${data.length} active client(s)`);
  return data;
}

async function branchExists(repo) {
  try {
    await octokit.rest.git.getRef({
      owner: OWNER,
      repo,
      ref: `heads/${BRANCH_NAME}`,
    });
    return true;
  } catch (e) {
    if (e.status === 404) return false;
    throw e;
  }
}

async function propagateToClient(client, baseBlobs) {
  // github_repo is "Willfwalker/client-slug" — extract the repo name
  const repo = client.github_repo?.split("/")?.[1];
  if (!repo) {
    console.log(`  Skipping ${client.slug}: no github_repo set`);
    return;
  }

  console.log(`\nProcessing: ${client.business_name} (${repo})`);

  const branchAlreadyExists = await branchExists(repo);

  // Get client repo's main branch SHA
  const { data: clientRef } = await octokit.rest.git.getRef({
    owner: OWNER,
    repo,
    ref: "heads/main",
  });
  const clientMainSha = clientRef.object.sha;

  // Get client repo's current tree to diff against
  const { data: clientCommit } = await octokit.rest.git.getCommit({
    owner: OWNER,
    repo,
    commit_sha: clientMainSha,
  });
  const { data: clientTree } = await octokit.rest.git.getTree({
    owner: OWNER,
    repo,
    tree_sha: clientCommit.tree.sha,
    recursive: "true",
  });

  // Build a map of path → sha for the client's current files
  const clientShaMap = new Map();
  for (const item of clientTree.tree) {
    if (item.type === "blob") clientShaMap.set(item.path, item.sha);
  }

  // Only copy blobs that differ from what the client already has
  const changedBlobs = baseBlobs.filter(
    (item) => clientShaMap.get(item.path) !== item.sha
  );

  console.log(`  ${changedBlobs.length} changed file(s) out of ${baseBlobs.length}`);

  if (changedBlobs.length === 0) {
    console.log("  No changes to propagate — skipping");
    return;
  }

  const newTreeItems = [];

  for (const item of changedBlobs) {
    const { data: blob } = await octokit.rest.git.getBlob({
      owner: OWNER,
      repo: SOURCE_REPO,
      file_sha: item.sha,
    });

    const { data: newBlob } = await octokit.rest.git.createBlob({
      owner: OWNER,
      repo,
      content: blob.content,
      encoding: blob.encoding,
    });

    newTreeItems.push({
      path: item.path,
      mode: item.mode,
      type: "blob",
      sha: newBlob.sha,
    });
  }

  // Create tree with base_tree to preserve client-only files
  const { data: newTree } = await octokit.rest.git.createTree({
    owner: OWNER,
    repo,
    tree: newTreeItems,
    base_tree: clientMainSha,
  });

  // Create commit
  const { data: newCommit } = await octokit.rest.git.createCommit({
    owner: OWNER,
    repo,
    message: `chore: template update from Fitted Base (${today})`,
    tree: newTree.sha,
    parents: [clientMainSha],
  });

  if (branchAlreadyExists) {
    // Force-update existing branch to the new commit
    await octokit.rest.git.updateRef({
      owner: OWNER,
      repo,
      ref: `heads/${BRANCH_NAME}`,
      sha: newCommit.sha,
      force: true,
    });
    console.log(`  Updated existing branch ${BRANCH_NAME}`);
  } else {
    // Create branch + open PR
    await octokit.rest.git.createRef({
      owner: OWNER,
      repo,
      ref: `refs/heads/${BRANCH_NAME}`,
      sha: newCommit.sha,
    });

    const { data: pr } = await octokit.rest.pulls.create({
      owner: OWNER,
      repo,
      title: `Template Update — ${today}`,
      head: BRANCH_NAME,
      base: "main",
      body: [
        "## Template Update from Fitted Base",
        "",
        "This PR contains the latest updates from the Fitted Base template.",
        "",
        "### Review Instructions",
        "- Review the changes to ensure they don't conflict with your customizations",
        "- If there are merge conflicts, resolve them keeping your custom changes where appropriate",
        "- Template files you haven't modified will update cleanly",
        "",
        "---",
        "*Automated by Fitted Software propagation pipeline*",
      ].join("\n"),
    });

    console.log(`  PR created: ${pr.html_url}`);
  }
}

async function main() {
  console.log("=== Fitted Base Update Propagation ===\n");

  const baseBlobs = await getBaseTree();
  console.log(`Base/ contains ${baseBlobs.length} files`);

  const clients = await getActiveClients();
  if (!clients.length) return;

  const failures = [];

  for (const client of clients) {
    try {
      await propagateToClient(client, baseBlobs);
    } catch (err) {
      console.error(`  FAILED for ${client.slug}: ${err.message}`);
      failures.push({ slug: client.slug, error: err.message });
    }

    // Rate limit buffer between clients
    await sleep(2000);
  }

  if (failures.length) {
    console.error(`\n${failures.length} client(s) failed:`);
    for (const f of failures) {
      console.error(`  - ${f.slug}: ${f.error}`);
    }
    process.exit(1);
  }

  console.log("\nAll clients processed successfully.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
