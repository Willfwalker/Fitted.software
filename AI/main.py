import os
import sys
import subprocess
import tempfile
import time
import logging
import uuid
import asyncio
from pathlib import Path

import pexpect
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("agent-worker")

app = FastAPI(title="AI Coding Agent Worker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Load baseline system prompt once at startup
# ---------------------------------------------------------------------------
_SYSTEM_PROMPT_PATH = Path(__file__).parent / "system-prompt.md"
_SYSTEM_PROMPT = _SYSTEM_PROMPT_PATH.read_text() if _SYSTEM_PROMPT_PATH.exists() else ""

# ---------------------------------------------------------------------------
# Concurrency: only 1 Claude CLI process at a time, queue the rest
# ---------------------------------------------------------------------------
MAX_CONCURRENT_JOBS = int(os.environ.get("MAX_CONCURRENT_JOBS", "1"))
_semaphore = asyncio.Semaphore(MAX_CONCURRENT_JOBS)

# ---------------------------------------------------------------------------
# In-memory job store (swap for Redis / DB in production)
# ---------------------------------------------------------------------------
jobs: dict[str, dict] = {}

# ---------------------------------------------------------------------------
# Request model
# ---------------------------------------------------------------------------
class TriggerPayload(BaseModel):
    repo_url: str       # e.g. https://github.com/your-org/glide.study.git
    task_prompt: str     # natural-language coding task


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/")
def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Trigger endpoint
# ---------------------------------------------------------------------------
@app.post("/api/trigger-agent")
async def trigger_agent(payload: TriggerPayload):
    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "queued", "detail": None}
    asyncio.create_task(_guarded_run(job_id, payload.repo_url, payload.task_prompt))
    return {"job_id": job_id, "status": "queued"}


async def _guarded_run(job_id: str, repo_url: str, task_prompt: str):
    """Acquire the semaphore so only N jobs run at once; others wait."""
    logger.info("Job %s waiting for slot (%s active max)", job_id, MAX_CONCURRENT_JOBS)
    async with _semaphore:
        logger.info("Job %s acquired slot — starting", job_id)
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, run_agent, job_id, repo_url, task_prompt)


# ---------------------------------------------------------------------------
# Job status endpoint
# ---------------------------------------------------------------------------
@app.get("/api/job/{job_id}")
def job_status(job_id: str):
    job = jobs.get(job_id)
    if not job:
        return {"error": "job not found"}, 404
    return job


# ---------------------------------------------------------------------------
# Background worker
# ---------------------------------------------------------------------------
def _run(cmd: list[str], cwd: str, env: dict | None = None) -> str:
    """Run a shell command, log it, return stdout."""
    merged = {**os.environ, **(env or {})}
    logger.info("$ %s", " ".join(cmd))
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, env=merged)
    if result.returncode != 0:
        logger.error("STDERR: %s", result.stderr.strip())
        raise RuntimeError(result.stderr.strip())
    return result.stdout.strip()


def run_agent(job_id: str, repo_url: str, task_prompt: str):
    jobs[job_id]["status"] = "running"
    github_token = os.environ.get("GITHUB_TOKEN", "")

    with tempfile.TemporaryDirectory(prefix="agent-") as workspace:
        try:
            # ── 1. Clone ─────────────────────────────────────────────
            _run(["git", "clone", repo_url, "."], cwd=workspace)

            # Configure git identity and auth for push
            _run(["git", "config", "user.email", "agent@fittedagency.com"], cwd=workspace)
            _run(["git", "config", "user.name", "Fitted AI Agent"], cwd=workspace)

            # Set the remote to the authenticated URL for push
            auth_url = repo_url.replace(
                "https://github.com/",
                f"https://x-access-token:{github_token}@github.com/",
            )
            _run(["git", "remote", "set-url", "origin", auth_url], cwd=workspace)

            # ── 2. Inject baseline rules ────────────────────────────
            # Write CLAUDE.md so the CLI picks up project conventions
            # automatically. Appends to any existing CLAUDE.md in the repo.
            claude_md = Path(workspace) / "CLAUDE.md"
            existing = claude_md.read_text() if claude_md.exists() else ""
            claude_md.write_text(
                existing
                + "\n\n"
                + "# ── Fitted Agency Agent Rules (auto-injected) ──\n\n"
                + _SYSTEM_PROMPT
            )

            # ── 3. Branch ────────────────────────────────────────────
            branch = f"ai-feature-{int(time.time())}"
            _run(["git", "checkout", "-b", branch], cwd=workspace)

            # ── 4. Run Claude CLI via pexpect ────────────────────────
            plan_text = _run_claude_cli(task_prompt, workspace)

            # ── 5. Commit & Push ─────────────────────────────────────
            _run(["git", "add", "."], cwd=workspace)

            short_task = task_prompt[:72]
            _run(
                ["git", "commit", "-m", f"AI Update: {short_task}"],
                cwd=workspace,
            )
            _run(["git", "push", "-u", "origin", branch], cwd=workspace)

            # ── 6. Create Pull Request ───────────────────────────────
            pr_body = f"## AI Agent Task\n\n{task_prompt}\n\n## Plan\n\n{plan_text}"
            pr_out = _run(
                [
                    "gh", "pr", "create",
                    "--title", f"AI Task: {short_task}",
                    "--body", pr_body,
                ],
                cwd=workspace,
                env={"GH_TOKEN": github_token},
            )

            jobs[job_id]["status"] = "complete"
            jobs[job_id]["detail"] = {"branch": branch, "pr": pr_out, "plan": plan_text}
            logger.info("Job %s complete — PR: %s", job_id, pr_out)

        except Exception as exc:
            logger.exception("Job %s failed", job_id)
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["detail"] = str(exc)


# ---------------------------------------------------------------------------
# Claude CLI interaction via pexpect
# ---------------------------------------------------------------------------
def _run_claude_cli(task_prompt: str, cwd: str) -> str:
    """Spawn the Claude CLI, auto-accept its plan, and return the plan text."""
    cmd = f'claude "{task_prompt}" --dangerously-skip-permissions'
    logger.info("Spawning Claude CLI in %s", cwd)

    child = pexpect.spawn(
        "/bin/bash",
        ["-c", cmd],
        cwd=cwd,
        encoding="utf-8",
        timeout=600,  # 10 min ceiling
    )
    child.logfile_read = sys.stdout  # stream output to container logs

    plan_text = ""

    try:
        # Wait for the plan / acceptance prompt
        index = child.expect(
            [
                r"(?i)accept\s*plan",   # 0 — plan acceptance prompt
                pexpect.EOF,            # 1 — finished without asking
                pexpect.TIMEOUT,        # 2 — timed out
            ],
            timeout=540,
        )

        if index == 0:
            # Capture everything printed so far as the plan
            plan_text = child.before or ""
            logger.info("Plan detected — sending 'y'")
            child.sendline("y")
            child.expect(pexpect.EOF, timeout=300)
            plan_text += child.before or ""
        elif index == 1:
            plan_text = child.before or ""
        else:
            plan_text = child.before or ""
            logger.warning("Claude CLI timed out waiting for plan prompt")

    except pexpect.exceptions.TIMEOUT:
        plan_text = child.before or ""
        logger.warning("Claude CLI global timeout reached")
    finally:
        child.close()

    return plan_text.strip()
