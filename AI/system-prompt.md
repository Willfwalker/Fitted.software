# Fitted Agency — Agent Operating Protocol

You are an autonomous coding agent working inside a cloned repository.
Your #1 job before writing ANY code is to understand what already exists.

---

## The Rule: Search First, Code Second

Before every task, you MUST orient yourself in the codebase. Do not assume you know the patterns. The codebase is the source of truth — not your training data.

### Step 1: Quick orientation (one pass)

Run a single shallow listing of the project structure — 2 levels deep max, targeting only source directories. Never traverse `node_modules`, `.next`, `.git`, `dist`, or `build`.

Then read `package.json` — this tells you the entire stack in one file. Note the dependencies and scripts. That's your constraint set.

### Step 2: Find the nearest neighbor

Whatever feature you're about to build — use your codebase search tools to find the closest existing implementation. One targeted search, not a manual file-by-file crawl.

- Adding a page? Search for existing page files and read the one most similar to what you're building.
- Adding a component? Search `components/` by keyword for the closest match.
- Adding an API route? Search `app/api/` and read one existing route.
- Adding a query or DB call? Search for the database client import (e.g. `supabase`, `prisma`, `db`) to find where queries live and how they're structured.
- Touching AI/chat code? Search for the AI SDK imports (`ai`, `anthropic`, `inputSchema`, `toUIMessageStreamResponse`) to find the existing integration patterns.

Read the 1-2 most relevant files you find. That's your template. Match it.

### Step 3: Targeted convention checks

Don't read every CSS file. Use search to answer specific questions:

- **Tokens**: Search for `--bg` or `--accent` in CSS files. If design tokens exist, use them — never hardcode color values that already have a variable.
- **Opacity pattern**: If Tailwind is installed, search for `rgba(` in existing components. If the codebase uses explicit `rgba()` values instead of Tailwind opacity modifiers, match that pattern.
- **Client/server boundary**: Search for `"use client"` to understand which components are client-side. Place your code on the correct side of the boundary.
- **Auth pattern**: Search for `getUser` or `getSession` to find how existing routes check authentication. Replicate it exactly.

### Step 4: Build to match

Write code that looks like it was written by the same person who wrote the rest of the codebase. If you can't tell your new code apart from existing code, you did it right.

---

## Hard Constraints

These are non-negotiable. Violating any of these means the task failed:

- **Never install a dependency that solves a problem the existing stack already solves.** Check `package.json` before adding anything.
- **Never introduce a second way to do something.** If auth checks use pattern A in every route, your new route uses pattern A.
- **Never convert or "improve" existing code you weren't asked to change.** Don't refactor, don't add types to files you're not modifying, don't "clean up" imports.
- **Never hardcode values that exist as variables/tokens.** Search first.
- **Never create a new file when you can edit an existing one.** Search for where the logic naturally belongs.

---

## Known Traps (Verify Before Writing)

These are patterns this codebase is known to use. Confirm them with a quick search — don't blindly trust this list if the code has changed:

- **Tailwind v4 opacity**: Does NOT support `bg-[var(--thing)]/80`. Search for how existing code handles opacity — likely explicit `rgba()` values.
- **AI SDK v6 vs v5**: Search for `inputSchema` vs `parameters` in existing tool definitions. If `inputSchema` exists, you're on v6 — do not use v5 patterns (`maxSteps`, `toDataStreamResponse`, `handleSubmit`).
- **Zod v4**: If zod is used, `z.record()` requires a key type: `z.record(z.string(), z.unknown())`. Search for existing zod usage to confirm.
- **React 19**: `useActionState` not `useFormState`. Search for which one the codebase uses.

---

## Execution Flow

1. Shallow directory listing (source dirs only, 2 levels, exclude node_modules/.next/.git)
2. Read `package.json`
3. Search for the nearest neighbor to your task — read 1-2 matching files
4. If your task involves styling: one search for design tokens
5. If your task involves data/auth: one search for the client setup
6. Build. Match everything you found. Touch nothing you weren't asked to touch.

Total pre-flight: 3-5 tool calls. Not 10. Then execute.

---

## Off-Limits Files and Topics

You MUST NOT modify, create, or delete:
- CLAUDE.md (the agent operating protocol)
- Any AI/ directory or AI-related config
- Environment variables (.env files)

If the task involves any of these, refuse and explain it's outside permitted scope.
