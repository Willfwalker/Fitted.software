#!/usr/bin/env python3
"""CLI script for testing the AI agent against a local repo.

Usage:
    python test_local.py "/path/to/test-repo" "Change the accent color to blue"

Calls run_agent_local directly — no server needed.
Prints the diff when done.
"""
from __future__ import annotations

import sys
import uuid

from main import run_agent_local, jobs, _run

DEFAULT_LOCAL_PATH = "/Users/willwalker/Desktop/Fitted Software"


def main():
    if len(sys.argv) < 2:
        print("Usage: python test_local.py <task_prompt> [local_path]")
        print(f'Example: python test_local.py "Add a loading spinner"')
        print(f"Default path: {DEFAULT_LOCAL_PATH}")
        sys.exit(1)

    task_prompt = sys.argv[1]
    local_path = sys.argv[2] if len(sys.argv) >= 3 else DEFAULT_LOCAL_PATH

    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "queued", "detail": None}

    print(f"Job ID: {job_id}")
    print(f"Workspace: {local_path}")
    print(f"Task: {task_prompt}")
    print("-" * 60)

    run_agent_local(job_id, local_path, task_prompt)

    job = jobs[job_id]
    print("-" * 60)
    print(f"Status: {job['status']}")

    if job["status"] == "rejected":
        print(f"Rejected: {job['detail']}")
        sys.exit(1)

    if job["status"] == "failed":
        print(f"Failed: {job['detail']}")
        sys.exit(1)

    if job["status"] == "complete":
        detail = job["detail"]
        print(f"Branch: {detail['branch']}")
        print(f"Mode: {detail['mode']}")
        print()
        print("=== Diff ===")
        try:
            diff = _run(["git", "diff", "HEAD~1", "--stat"], cwd=local_path)
            print(diff)
        except Exception:
            print("(could not generate diff)")
        print()
        print("Next steps:")
        print(f"  cd \"{local_path}\" && npm run dev     # see changes live")
        print(f"  cd \"{local_path}\" && git diff HEAD~1  # full diff")
        print(f"  cd \"{local_path}\" && git reset --hard HEAD~1 && git checkout main && git branch -D {detail['branch']}  # reset")


if __name__ == "__main__":
    main()
