# Fitted Agency — Base Application

## Overview
AI-powered agency-in-a-box SaaS. Each customer gets a copy of this base, and an AI agent customizes the source code per customer.

## Tech Stack
- Next.js 16 (App Router) on Vercel
- Supabase (Auth + PostgreSQL + Storage) — NOT Prisma, NOT Auth.js
- Tailwind v4 + shadcn/ui (new-york style)
- Zod for validation
- Resend for email
- @react-pdf/renderer for PDF generation

## Module Navigation
Before modifying or adding to any module, read MODULES.md for the full registry.
Each module follows identical structure. Find the nearest neighbor in MODULES.md, read those files, then build to match.

## Conventions

### File Structure Per Module
```
supabase/schemas/NNN_module.sql     — Database schema
lib/types/module.ts                 — TypeScript interfaces + display configs
lib/validations/module.ts           — Zod schemas
lib/actions/module.ts               — Server actions ("use server")
app/(dashboard)/module/             — Server page components
components/module/                  — Client components
```

### Server Actions Pattern
- All actions start with `const ctx = await getOrgId()` from `lib/actions/helpers.ts`
- All queries scoped by `.eq("org_id", ctx.orgId)`
- Return `{ data, error }` pattern
- Log activities via `createActivity()` from `lib/actions/activities.ts`
- Use `revalidatePath()` after mutations

### Component Pattern
- Server pages: fetch data, pass to client components as props
- Client components: "use client", receive data via props, handle forms with server actions
- Forms use Zod validation from lib/validations/
- Lists follow CompanyList.tsx pattern (table with search/filter)
- Kanban follows DealsPipeline.tsx pattern (columns with drag cards)

### Database Conventions
- All tables have: id (uuid PK default gen_random_uuid()), org_id (FK), created_by (FK to auth.users), created_at, updated_at
- RLS enabled on all tables, policies scoped to org membership
- Enums defined as PostgreSQL types
- metadata jsonb column for extensibility

### Design Tokens (Dark Theme)
- --bg: #0B0B0B
- --bg-card: #1A1816
- --bg-elevated: #141210
- --accent: #D4734E
- --text: #E8E0D4
- --text-muted: #A89F94
- --text-dim: #6B6560
- --border: #2A2520
- NEVER use Tailwind opacity modifiers on CSS variables: use rgba() instead

### Navigation
Edit `components/dashboard/DashboardNav.tsx` and `components/dashboard/MobileNav.tsx` to add/enable nav items.

### Search Integration
Add new entity types to `lib/actions/search.ts` globalSearch() and `components/search/CommandKModal.tsx`.
