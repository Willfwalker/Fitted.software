# Fitted Agency — AI-Evolvable Platform

## Overview

A hyper-customizable business management platform for agencies. Instead of a rigid set of features, it provides a **bare-bones foundation** pairs with an **embedded AI Agent** that dynamically evolves the platform to fit the exact needs of the company.

### Core Philosophy
1. **Bare-Bones Foundation:** The absolute minimum viable data structures for Contacts, Deals, Projects, and Invoices.
2. **AI-Driven Evolution:** An integrated AI agent capable of generating new views, adding custom fields, building complex workflows, and adapting the UI on the fly based on conversational prompts.
3. **Infinite Customizability:** Every aspect of the site—from the data schema to the dashboard layouts—can be customized for both simple and highly advanced use cases.

**Phase 1 (now):** Auth, Dashboard shell, and the foundational AI Agent conversational interface.

---

## Infrastructure — One Server

No microservices. One Next.js app handles everything.

```
┌─────────────────────────────────────┐
│            Vercel                    │
│                                     │
│   Next.js App (App Router)          │
│   ├── /app (pages + layouts)        │
│   ├── /app/api (API routes)         │
│   └── Server Actions               │
│                                     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Supabase (PostgreSQL + Auth)   │
└─────────────────────────────────────┘
```

---

## Stack

| Layer        | Tech                          | Why                                           |
|-------------|-------------------------------|-----------------------------------------------|
| Framework   | Next.js 16 (App Router)       | SSR, API routes, server actions all in one     |
| Auth        | Supabase Auth                 | Email/password signup, handles sessions natively |
| Database    | Supabase PostgreSQL           | Relational data with RLS built in              |
| DB Client   | `@supabase/supabase-js`       | Native Supabase client, no ORM needed          |
| Styling     | Tailwind v4 + shadcn/ui       | Fast to build, consistent design system        |
| Payments    | Stripe                        | For invoicing module (later)                   |
| File Storage| Vercel Blob or S3             | For task attachments (later)                   |

---

## Auth Flow

**Sign up** — Multi-step:
1. Full name + email + password
2. Role selection: Owner (create org) or Employee (join via invite code)
3. Owner enters org name / Employee enters invite code
4. Supabase `auth.signUp()` with metadata → Postgres trigger creates org or joins existing

**Sign in** — Email + password via `auth.signInWithPassword()`

**Route protection:**
- `proxy.ts` (Next.js 16 middleware convention) refreshes session, redirects unauthenticated users from `/dashboard` to `/login`, and authenticated users from `/login` or `/signup` to `/dashboard`
- Dashboard layout double-checks auth + org membership server-side

**Multi-tenant:** `organizations` + `organization_members` tables with RLS. Postgres trigger on `auth.users` INSERT auto-creates org (OWNER) or joins via invite code (MEMBER).

---

## Database Schema (Phase 1)

```sql
organizations        -- Workspaces
organization_members -- Join table (user ↔ org, with role)
invite_codes         -- Invite codes for employee onboarding
```

Roles: `OWNER | ADMIN | MEMBER` (enum `app_role`)

Future modules add tables (Client, Deal, Project, Task, TimeEntry, Invoice).

---

## App Structure

```
/app
  /(marketing)          # Landing page
    /page.tsx
  /(auth)
    /login/page.tsx     # Email + password sign in
    /signup/page.tsx    # Multi-step sign up
  /(dashboard)
    /layout.tsx         # Sidebar + nav, session gate
    /dashboard/
      /page.tsx         # Dashboard home — summary cards
      /settings/page.tsx
  /api/auth/
    /callback/route.ts  # Auth callback (for future email confirmation)
    /validate-invite/route.ts  # Invite code validation
/proxy.ts               # Route middleware (Next.js 16 convention)
/lib/supabase/
  /client.ts            # Browser Supabase client
  /server.ts            # Server Supabase client
/supabase/
  /schema.sql           # Database schema (run in SQL editor)
```

---

## Deployment

- **App:** Vercel (free tier)
- **Database + Auth:** Supabase (free tier)
- **Total cost to start: $0**
