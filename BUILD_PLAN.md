# Fitted — AI-First Customizable SaaS Platform

## Build Plan

---

## Why This Architecture

Fitted's differentiator: **users customize their platform through an AI chatbot**, not settings menus. Instead of building every feature edge case, we build a **config-driven engine** — all UI layouts, data structures, views, and themes are stored as JSON in the database. The AI reads and writes these configs. The UI renders from them.

```
User asks AI → AI calls structured tool → Tool writes JSON config to DB → UI re-renders from new config
```

This means every component we build must be **config-aware** from day one. No hard-coded field names, no static column lists, no baked-in layouts.

---

## Current State

- Next.js 16 App Router, deployed on Vercel
- Landing page only (`app/page.tsx`, 970 lines, vanilla CSS)
- No auth, no dashboard, no database integration, no component library
- Supabase project configured (env vars present)
- Anthropic API key present
- Branch: `ai-first`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| Auth | Supabase Auth (Google OAuth + magic links) |
| Database | Supabase PostgreSQL (JSONB for dynamic data) |
| Styling | Tailwind CSS v4 + shadcn/ui (new-york, dark theme) |
| AI Model | Claude via `@ai-sdk/anthropic` |
| AI SDK | Vercel AI SDK (`ai` package) — streaming, tool calling |
| Validation | Zod (tool input schemas) |

---

## Three Architectural Layers

### 1. Data Layer — Entity-Field-Record Pattern
Like Notion/Airtable: all data types are dynamic. Instead of a `clients` table with typed columns, we have:
- **entities** table: defines what data types exist ("Clients", "Projects")
- **entity_fields** table: defines the fields per entity ("Name", "Email", "Status")
- **entity_records** table: stores all data as JSONB (`{ "name": "Acme", "email": "hi@acme.com" }`)

> **Known scaling limitation**: The EAV-with-JSONB pattern has a well-documented performance cliff. GIN indexes help with containment queries but won't save compound filter+sort operations once an entity has thousands of records. Before hitting serious scale, we'll likely need one of:
> - **Materialized views** for frequently-queried entity/field combinations
> - **PostgreSQL full-text search** for text-heavy filtering
> - **External search index** (Typesense or Meilisearch) for complex multi-field queries
>
> This is a known trade-off — flexibility now, optimization later. Don't panic when queries slow down at ~5-10K records per entity; that's the signal to add the indexing layer.

### 2. UI Layer — Config-Driven Rendering
Every page is rendered from JSON config stored in the database:
- **views** table: defines how entities are displayed (table, board, kanban, calendar, map)
- **pages** table: defines dashboard layouts (which widgets, where, what size)
- **Component Registry**: maps widget type strings ("kpi-card", "entity-table") to actual React components

### 3. AI Layer — Structured Tool Calls
The AI chatbot doesn't generate raw code. It calls structured tools with validated Zod schemas:
- `addField({ entity: "clients", name: "Priority", type: "select" })`
- `createView({ entity: "clients", type: "board", groupBy: "status" })`
- `modifyLayout({ page: "dashboard", action: "add", widget: { type: "kpi-card" } })`
- Each tool modifies config in DB → UI re-renders

---

# PHASES

---

## Phase 1: Foundation

**Goal**: Install dependencies, set up project structure, auth, database schema, and multi-tenant RLS. Everything else builds on this.

### 1.1 — Install Dependencies

```bash
# Core
npm install @supabase/supabase-js @supabase/ssr

# AI
npm install ai @ai-sdk/anthropic zod

# Styling
npm install tailwindcss @tailwindcss/postcss postcss

# shadcn/ui (interactive — choose: new-york style, dark, neutral base)
npx shadcn@latest init

# shadcn components we'll need
npx shadcn@latest add button input textarea card table badge dialog sheet select checkbox separator scroll-area avatar dropdown-menu skeleton tabs tooltip
```

### 1.2 — Tailwind v4 + CSS Coexistence

The landing page uses 1,296 lines of vanilla CSS. Tailwind must coexist without conflicts.

**Create** `postcss.config.mjs`:
```js
export default { plugins: { '@tailwindcss/postcss': {} } };
```

**Modify** `app/globals.css` — add `@import "tailwindcss";` at top. Map shadcn CSS variables to existing design tokens in `:root`:
```css
@import "tailwindcss";

:root {
  /* Existing tokens (keep all) */
  --bg: #0B0B0B;
  --accent: #D4734E;
  --text: #E8E0D4;
  --border: #2A2520;
  /* ... */

  /* shadcn mappings → point to same colors */
  --background: 0 0% 4.3%;      /* #0B0B0B */
  --foreground: 28 22% 87%;     /* #E8E0D4 */
  --primary: 16 58% 57%;        /* #D4734E */
  --card: 24 8% 9%;             /* #1A1816 */
  --border: 20 12% 15%;         /* #2A2520 */
  --radius: 0.75rem;
}
```

**Tailwind v4 gotcha**: Never use opacity modifiers on CSS variable arbitrary values. `bg-[var(--bg-card)]/80` silently produces nothing. Use `bg-[rgba(26,24,22,0.8)]` instead.

### 1.3 — Project File Structure

```
app/
  (marketing)/
    page.tsx                    ← Move existing landing page here
    layout.tsx                  ← Pass-through layout (no sidebar)
  (auth)/
    login/page.tsx              ← Google OAuth + magic link
    layout.tsx                  ← Centered card layout
  (dashboard)/
    layout.tsx                  ← Dashboard shell (sidebar + AI panel)
    dashboard/page.tsx          ← Config-driven main dashboard
    clients/page.tsx            ← Clients CRM (first entity)
    clients/[id]/page.tsx       ← Single client detail
    settings/page.tsx           ← Org settings
  api/
    auth/callback/route.ts      ← Supabase OAuth callback
    chat/route.ts               ← AI chat streaming endpoint
  layout.tsx                    ← Root layout (fonts, html)
  globals.css                   ← Design system + Tailwind
  proxy.ts                      ← Route protection (Next.js 16)

lib/
  supabase/
    server.ts                   ← Server-side Supabase client (cookies)
    client.ts                   ← Browser-side Supabase client
    admin.ts                    ← Service role client (server only)
  ai/
    tools.ts                    ← AI tool definitions (Zod schemas + handlers)
    system-prompt.ts            ← Dynamic system prompt builder
  db/
    entities.ts                 ← Entity CRUD operations
    fields.ts                   ← Field CRUD operations
    records.ts                  ← Record CRUD with JSONB filtering
    views.ts                    ← View CRUD operations
    pages.ts                    ← Page layout operations
    config-versions.ts          ← Config versioning for rollback
    seed.ts                     ← Default org seeding (entities, fields, views, pages)
  config/
    types.ts                    ← TypeScript types (Entity, Field, View, Page, etc.)
    registry.ts                 ← Component registry (widget type → component)
    defaults.ts                 ← Default configs for new orgs
  utils.ts                      ← cn() helper from shadcn

components/
  ui/                           ← shadcn components (auto-generated)
  layout/
    sidebar.tsx                 ← Dashboard sidebar navigation
    topbar.tsx                  ← Top bar with user menu
  entity/
    entity-table.tsx            ← Dynamic table (columns from field config)
    entity-form.tsx             ← Dynamic form (inputs from field config)
    entity-board.tsx            ← Kanban board view
    field-renderer.tsx          ← Renders single field by type (display + edit)
  pages/
    page-renderer.tsx           ← Renders page from JSON layout
    widget-renderer.tsx         ← Renders individual widget from registry
  widgets/
    kpi-widget.tsx              ← KPI stats card
    entity-table-widget.tsx     ← Table widget for dashboards
    activity-feed-widget.tsx    ← Recent activity feed
  chat/
    ai-sidebar.tsx              ← AI chat sidebar panel
    ai-sidebar-provider.tsx     ← Context for sidebar state + page context
    chat-message.tsx            ← Individual chat message
    tool-result.tsx             ← Visual display of tool execution results
```

### 1.4 — Supabase Client Setup

**`lib/supabase/server.ts`** — Cookie-based server client using `@supabase/ssr`. Used in Server Components and Server Actions.

**`lib/supabase/client.ts`** — Browser client using `@supabase/ssr`. Used in Client Components (never at render level — only inside useEffect/event handlers).

**`lib/supabase/admin.ts`** — Service role client for admin operations (seeding, triggers). Server-only.

### 1.5 — Database Schema

**File**: `supabase/schema.sql` (run in Supabase SQL Editor)

```sql
-- =============================================
-- MULTI-TENANT
-- =============================================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'My Organization',
  slug TEXT UNIQUE,
  theme JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner','admin','member','viewer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- =============================================
-- ENTITY SYSTEM (The Heart)
-- =============================================
CREATE TABLE public.entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  icon TEXT DEFAULT 'file',
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, slug)
);

CREATE TABLE public.entity_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- Display: "Email Address"
  slug TEXT NOT NULL,                    -- Key: "email_address"
  field_type TEXT NOT NULL CHECK (field_type IN (
    'text','textarea','number','currency','email','phone','url',
    'select','multi_select','checkbox','date','datetime',
    'relation','file','image','rating','color','json'
  )),
  config JSONB DEFAULT '{}',             -- Type-specific options:
                                         --   select: { options: [{value,label,color}] }
                                         --   currency: { currency: "USD" }
                                         --   relation: { entity_id, display_field }
                                         --   number: { min, max, step }
  is_required BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity_id, slug)
);

CREATE TABLE public.entity_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',      -- All field values as JSON
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_records_data ON entity_records USING GIN (data);
CREATE INDEX idx_records_entity ON entity_records (entity_id);
CREATE INDEX idx_records_org ON entity_records (organization_id);

-- =============================================
-- VIEW SYSTEM
-- =============================================
CREATE TABLE public.views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  view_type TEXT NOT NULL CHECK (view_type IN (
    'table','board','calendar','gallery','map','list'
  )),
  config JSONB DEFAULT '{}',             -- View-specific:
                                         --   table: { columns: [{field_slug, width, visible}] }
                                         --   board: { group_by_field, card_title_field, card_fields }
                                         --   calendar: { date_field, title_field }
  filters JSONB DEFAULT '[]',            -- [{ field_slug, operator, value }]
  sorts JSONB DEFAULT '[]',              -- [{ field_slug, direction }]
  group_by TEXT,
  is_default BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- PAGE LAYOUT SYSTEM
-- =============================================
CREATE TABLE public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  layout JSONB NOT NULL DEFAULT '{}',    -- Full layout definition:
                                         -- { rows: [{ id, columns: [{ width, widgets: [{ type, config }] }] }] }
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, slug)
);

-- =============================================
-- CONFIG VERSIONING (Rollback)
-- =============================================
CREATE TABLE public.config_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('entity','field','view','page','theme')),
  target_id UUID NOT NULL,
  previous_value JSONB NOT NULL,
  new_value JSONB NOT NULL,
  change_description TEXT,
  changed_by_ai BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- AI CHAT MESSAGES
-- =============================================
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  role TEXT CHECK (role IN ('user','assistant','system','tool')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- AUTO-CREATE ORG ON SIGNUP (Minimal trigger)
-- =============================================
-- The trigger ONLY creates the org + membership.
-- All seeding (entities, fields, views, pages) happens in
-- application code (lib/db/seed.ts) called after first login.
-- This keeps the trigger simple and the seed logic versionable/testable.
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  INSERT INTO public.organizations (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', 'My') || '''s Workspace')
  RETURNING id INTO new_org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- SEEDING (runs from application code, not SQL)
-- =============================================
-- See lib/db/seed.ts for the full seed function.
-- Called after first login when the org has no entities yet.
-- This makes the default schema easy to version, test, and modify
-- without touching database functions.
--
-- Seed creates:
--   - "Clients" entity with 9 fields (name, email, phone, company,
--     status, value, website, notes, source)
--   - Default table view ("All Clients") + board view ("Pipeline")
--   - Default dashboard page with KPI + table + activity widgets

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE views ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Helper: get user's org IDs
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS SETOF UUID AS $$
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Apply SELECT/INSERT/UPDATE/DELETE policies on every table
-- Pattern: organization_id IN (SELECT get_user_org_ids())
-- (Full policy definitions for each table)
```

### 1.6 — Application-Side Seeding (`lib/db/seed.ts`)

Instead of cramming all seed logic into a SQL trigger (fragile, hard to version/test), the trigger only creates the org + membership. Seeding happens in TypeScript:

```typescript
// lib/db/seed.ts — called after first login when org has no entities
export async function seedOrganization(supabase, orgId: string) {
  // Check if already seeded
  const { count } = await supabase.from('entities').select('*', { count: 'exact', head: true }).eq('organization_id', orgId);
  if (count > 0) return; // Already seeded

  // Create Clients entity + 9 fields + 2 views + dashboard page
  // (Same data as before, but in TypeScript — easy to version, test, modify)
}
```

Called from the dashboard layout's server component on first load. Idempotent — checks if entities already exist before seeding.

**Benefits over SQL trigger:**
- Easy to version in git alongside application code
- Testable with unit tests
- Can be modified without deploying SQL migrations
- TypeScript type checking on seed data
- Can be extended with more sophisticated logic (e.g., different seeds per plan tier)

### 1.7 — Auth Flow

- **Login page**: Client component with Google OAuth button + magic link email input
- **Auth callback**: `app/api/auth/callback/route.ts` exchanges code for session
- **Route protection**: `middleware.ts` or `proxy.ts` — redirects unauthenticated users from `/dashboard/*` to `/login`
- **Session refresh**: Middleware refreshes Supabase session cookies on every request

### 1.8 — Move Landing Page

Move `app/page.tsx` → `app/(marketing)/page.tsx` so it doesn't conflict with dashboard routes. Create `app/(marketing)/layout.tsx` as a pass-through.

### Testing Phase 1

| Test | How | Expected Result |
|------|-----|----------------|
| Landing page still works | Visit `/` | Landing page renders, animations work, waitlist form submits |
| Tailwind + vanilla CSS coexist | Inspect landing page | No style conflicts, existing classes still apply |
| shadcn components render | Add a `<Button>` to a test page | Button renders with dark theme colors |
| Login page renders | Visit `/login` | See Google OAuth button + email input |
| Google OAuth flow | Click "Sign in with Google" | Redirected to Google → back to `/dashboard` |
| Magic link flow | Enter email, click send | Email received, clicking link logs in |
| Org auto-created | Check Supabase `organizations` table | New org exists for the signed-up user |
| Seed data created | Check `entities`, `entity_fields`, `views`, `pages` | "Clients" entity with 9 fields, 2 views, dashboard page |
| RLS works | Try querying from another user's session | No data returned (org isolation) |
| Route protection | Visit `/dashboard` while logged out | Redirected to `/login` |
| Auth redirect | Visit `/login` while logged in | Redirected to `/dashboard` |

---

## Phase 2: Entity Engine + Clients CRM

**Goal**: Build the dynamic entity/field/record system. Render the Clients module as the first consumer.

### 2.1 — TypeScript Types (`lib/config/types.ts`)

Define types for every config shape:
- `Entity`, `EntityField`, `EntityRecord`
- `FieldType` union (`'text' | 'email' | 'select' | ...`)
- `FieldConfig` (options for select, currency settings, etc.)
- `View`, `ViewFilter`, `ViewSort`
- `Page`, `PageLayout`, `PageRow`, `PageColumn`, `WidgetConfig`

These types are shared by every component and DB module.

### 2.2 — Database Operation Modules (`lib/db/`)

Each module exports async functions that accept a Supabase client (so RLS is enforced).

**`lib/db/entities.ts`**:
- `getEntities(supabase, orgId)` → list entities for sidebar
- `getEntityBySlug(supabase, orgId, slug)` → get entity by slug
- `createEntity(supabase, orgId, data)` → create new entity
- `deleteEntity(supabase, entityId)` → delete (blocks system entities)

**`lib/db/fields.ts`**:
- `getFields(supabase, entityId)` → list fields sorted by sort_order
- `addField(supabase, entityId, orgId, field)` → insert new field
- `updateField(supabase, fieldId, updates)` → modify field config
- `removeField(supabase, fieldId)` → delete (blocks system fields)

**`lib/db/records.ts`**:
- `getRecords(supabase, entityId, orgId, { filters, sorts, limit, offset })` → query JSONB data with dynamic filters
- `createRecord(supabase, entityId, orgId, userId, data)` → insert
- `updateRecord(supabase, recordId, data)` → update JSONB data
- `deleteRecord(supabase, recordId)` → delete

**`lib/db/views.ts`**:
- `getViews(supabase, entityId, orgId)` → list views for entity
- `getDefaultView(supabase, entityId, orgId)` → get default view
- `createView(supabase, data)` / `updateView` / `deleteView`

**`lib/db/pages.ts`**:
- `getPageBySlug(supabase, orgId, slug)` → get page layout
- `updatePageLayout(supabase, pageId, layout)` → update layout JSON

### 2.3 — Field Renderer (`components/entity/field-renderer.tsx`)

A component that renders the correct input or display for any field type:

**Display mode** (in tables, cards):
- `text` → plain text
- `email` → mailto link
- `phone` → tel link
- `select` → colored badge
- `currency` → formatted with $ sign
- `checkbox` → check/x icon
- `date` → formatted date
- `url` → clickable link
- `rating` → star display

**Edit mode** (in forms):
- `text` → `<Input>`
- `textarea` → `<Textarea>`
- `select` → `<Select>` with options from config
- `date` → date input
- `checkbox` → `<Checkbox>`
- `currency` → number input with $ prefix
- etc.

### 2.4 — Entity Table (`components/entity/entity-table.tsx`)

Dynamic table component using shadcn `<Table>`:
- Reads column list from view config (`config.columns`)
- Only shows columns where `visible: true`
- Each cell uses `FieldRenderer` in display mode
- Column headers show field display names
- Sortable column headers (click to sort)
- Row click → navigate to detail page or open sheet

### 2.5 — Entity Form (`components/entity/entity-form.tsx`)

Dynamic form rendered from entity fields:
- Iterates `entity_fields` sorted by `sort_order`
- Each field → `FieldRenderer` in edit mode
- Validates required fields before submit
- Used inside a `<Sheet>` or `<Dialog>` for create/edit

### 2.6 — Clients Page (`app/(dashboard)/clients/page.tsx`)

Server Component:
1. Fetches user → org → "clients" entity → fields → default view → records
2. Renders page header with "Add Client" button
3. Renders view tabs (switch between "All Clients" table and "Pipeline" board)
4. Renders `EntityTable` or `EntityBoard` based on active view
5. "Add Client" opens `EntityForm` in a Sheet

### 2.7 — Server Actions for Record CRUD

`app/(dashboard)/clients/actions.ts`:
- `createRecord(entityId, orgId, data)` — insert + `revalidatePath`
- `updateRecord(recordId, data)` — update JSONB + `revalidatePath`
- `deleteRecord(recordId)` — delete + `revalidatePath`

### Testing Phase 2

| Test | How | Expected Result |
|------|-----|----------------|
| Clients page renders | Navigate to `/dashboard/clients` | Table with column headers (Name, Email, Company, Status, Value) |
| Empty state | No records yet | Shows "No clients yet" message with Add button |
| Create client | Click "Add Client", fill form, submit | New row appears in table, record in DB |
| Field types render correctly | Add client with all fields filled | Email is clickable, status shows colored badge, value shows $X,XXX |
| Edit client | Click row → edit form | Form pre-fills with existing data, save updates record |
| Delete client | Delete action | Row removed from table, record removed from DB |
| View tabs work | Switch between "All Clients" and "Pipeline" | Table view vs board view |
| Dynamic columns | Check visible columns match view config | Only visible columns shown, hidden ones absent |
| Required field validation | Try to create client without Name | Validation error shown |
| JSONB filtering | (manual) Add filter to view config | Only matching records shown |

---

## Phase 3: View & Layout System

**Goal**: Build the rendering pipeline that turns JSON configs into UI. This makes everything AI-customizable.

### 3.1 — Dashboard Layout Shell (`app/(dashboard)/layout.tsx`)

Server Component that wraps all dashboard pages:
- Fetches user, org membership, entities list
- Renders three-column layout: `Sidebar | Content | (AI Panel slot)`
- Sidebar shows nav items dynamically from entities list
- Wraps children in `AISidebarProvider` for chat state

### 3.2 — Sidebar (`components/layout/sidebar.tsx`)

Client Component:
- Logo/brand at top
- "Dashboard" link (always present)
- Entity nav items dynamically generated from entities list
- Each item shows entity icon (lucide) + name
- Active state based on current pathname
- Settings link at bottom
- AI chat toggle button

### 3.3 — Component Registry (`lib/config/registry.ts`)

Maps widget type strings to React components:

```typescript
const registry = {
  'kpi': KpiWidget,
  'entity-table': EntityTableWidget,
  'activity-feed': ActivityFeedWidget,
  'chart': ChartWidget,
};
```

Functions:
- `getWidgetComponent(type)` → returns component or null
- `getAvailableWidgetTypes()` → returns list (used in AI system prompt)
- `registerWidget(type, component)` → add new widget (for Phase 5)

### 3.4 — Page Renderer (`components/pages/page-renderer.tsx`)

Takes a `PageLayout` JSON config and renders it:
- Iterates rows → columns → widgets
- Each column gets CSS grid `col-span-{width}` (12-column grid)
- Each widget rendered via `WidgetRenderer` which looks up the component registry
- Unknown widget types show a placeholder

### 3.5 — Widget Components

**KPI Widget** (`components/widgets/kpi-widget.tsx`):
- Fetches aggregate data from entity_records based on config
- Supports metrics: `count`, `sum`, `avg`
- Supports filters (e.g., count where status = "active")
- Displays as a card with title, big number, optional trend

**Entity Table Widget** (`components/widgets/entity-table-widget.tsx`):
- Embeds `EntityTable` for dashboard use
- Config specifies entity, view, and row limit

**Activity Feed Widget** (`components/widgets/activity-feed-widget.tsx`):
- Shows recent record changes (created/updated)
- Config specifies entity and limit

### 3.6 — Board View (`components/entity/entity-board.tsx`)

Kanban board:
- Groups records by a select field (specified in view config `group_by_field`)
- Each group = a column with the option label as header
- Cards show configurable fields (from `card_fields` in config)
- Drag-and-drop between columns updates the record's group field

### 3.7 — Dashboard Page (`app/(dashboard)/dashboard/page.tsx`)

Server Component:
1. Fetches dashboard page config from `pages` table
2. Passes `layout` JSON to `PageRenderer`
3. Widgets fetch their own data based on their configs

### Testing Phase 3

| Test | How | Expected Result |
|------|-----|----------------|
| Dashboard layout renders | Navigate to `/dashboard` | Sidebar + content area visible |
| Sidebar shows entities | Check sidebar nav items | "Dashboard" + "Clients" items with icons |
| Active nav state | Click between pages | Active item highlighted |
| Dashboard page renders | Visit `/dashboard` | KPI cards + table widget + activity feed |
| KPI widget shows data | Add some client records | "Total Clients" shows correct count |
| KPI with filter | Check "Active" KPI | Only counts active clients |
| Entity table widget | Dashboard shows recent clients | Table with 10 rows max |
| Board view works | Switch to "Pipeline" view on clients | Kanban columns by status |
| Board drag-and-drop | Drag a client card between columns | Status field updates in DB |
| Page renderer handles unknown widgets | Add bogus widget type to page config | Shows placeholder, doesn't crash |
| Component registry | Call `getAvailableWidgetTypes()` | Returns ['kpi', 'entity-table', 'activity-feed'] |
| Responsive layout | Resize browser | Columns stack on mobile |

---

## Phase 4: AI Sidebar Chatbot

**Goal**: Build the Claude-powered sidebar that modifies platform configs through structured tool calls.

### 4.1 — AI Sidebar Provider (`components/chat/ai-sidebar-provider.tsx`)

React Context that provides:
- `isOpen` / `toggle()` — sidebar open/close state
- `currentContext` — current page, entity, view (updated by each page)
- Wraps the entire dashboard layout

### 4.2 — AI Sidebar UI (`components/chat/ai-sidebar.tsx`)

Client Component using `useChat` from `@ai-sdk/react`:
- Fixed panel on right side (`w-96`), slides in/out
- When closed: floating sparkles button (bottom-right)
- When open: header + scrollable message list + input
- Sends `context` (current page, entity, view) with each message
- Messages include:
  - User messages (text)
  - AI responses (streaming text)
  - Tool results (visual cards showing what changed)
- Input: textarea with Shift+Enter for newlines, Enter to send

### 4.3 — Chat Message Component (`components/chat/chat-message.tsx`)

Renders different message types:
- User: right-aligned, styled bubble
- Assistant: left-aligned, markdown rendered
- Tool results: colored cards showing success/error + what changed

### 4.4 — Chat API Route (`app/api/chat/route.ts`)

The AI backend:

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

// Uses Claude Sonnet for speed + cost efficiency
// System prompt includes current org schema state
// Tools defined with Zod schemas
// maxSteps: 5 for multi-step operations
```

### 4.5 — System Prompt Builder (`lib/ai/system-prompt.ts`)

Dynamically builds a system prompt that includes:
- All entities and their fields (names, types, configs)
- All views and their configs
- All pages and their layouts
- Current page context (what the user is looking at)
- Available widget types
- Rules (don't delete system fields, validate inputs, confirm destructive actions)

This gives the AI complete awareness of the current platform state.

### 4.6 — AI Tool Definitions (`lib/ai/tools.ts`)

Each tool has a Zod input schema and an `execute` function:

| Tool | Description | Key Parameters |
|------|-------------|---------------|
| `addField` | Add a custom field to an entity | entity_slug, name, slug, field_type, config |
| `removeField` | Remove a field (blocks system fields) | entity_slug, field_slug |
| `updateField` | Modify field config (rename, change options) | entity_slug, field_slug, updates |
| `createView` | Create a new view (table, board, etc.) | entity_slug, name, view_type, config |
| `updateView` | Modify view config (columns, filters, sort) | view_id, updates |
| `modifyLayout` | Change page layout (add/remove/move widgets) | page_slug, layout |
| `changeTheme` | Update org theme colors | accent, background, foreground |
| `createEntity` | Create entirely new entity type | name, slug, icon, fields[] |
| `rollbackConfig` | Undo a previous config change | target_type, target_id |

### 4.7 — Config Versioning (`lib/db/config-versions.ts`)

Every AI tool call saves a snapshot before making changes:
1. Read current state of target (field, view, page, etc.)
2. Save to `config_versions` with `previous_value` and `new_value`
3. Execute the change
4. If rollback requested → restore `previous_value`

### 4.8 — Real-Time UI Updates

After AI makes a change, the UI must reflect it:
- Each tool handler calls `revalidatePath()` on affected routes
- The chat component calls `router.refresh()` after receiving tool results
- This causes Server Components to re-fetch from Supabase with updated config

### Testing Phase 4

| Test | How | Expected Result |
|------|-----|----------------|
| Sidebar opens/closes | Click sparkles button | Panel slides in from right |
| Send a message | Type "Hello" and press Enter | AI responds with greeting |
| Streaming works | Send a longer question | Text appears word-by-word |
| **Add field** | "Add a priority field to clients with options high, medium, low" | AI calls `addField` tool, field appears in clients table |
| **Remove field** | "Remove the source field from clients" | Field removed from table |
| **Block system field removal** | "Remove the name field" | AI refuses (system field) |
| **Create view** | "Create a board view of clients grouped by status" | New "Pipeline" view appears in view tabs |
| **Modify view** | "Hide the phone column from the clients table" | Column disappears |
| **Add filter** | "Show me only active clients" | Table filters to active only |
| **Change theme** | "Make the accent color blue" | Accent changes to blue across UI |
| **Create entity** | "Create a Projects entity with fields: name, status, deadline, budget" | New entity appears in sidebar, navigable |
| **Rollback** | "Undo that last change" | Previous config restored |
| Context awareness | Be on clients page, say "Add a field here" | AI knows you mean clients, doesn't ask |
| Multi-step | "Create an invoices entity and add it to the dashboard" | AI creates entity + modifies dashboard layout |
| Error handling | "Add a field with invalid type 'xyz'" | AI returns helpful error message |
| Config version created | Check `config_versions` table after a change | Snapshot with before/after values |

---

## Phase 5: Dashboard Widgets & Charts

**Goal**: Build out the widget library that makes dashboards useful.

### 5.1 — Chart Widget (`components/widgets/chart-widget.tsx`)

- Config specifies: entity, metric, group_by, chart_type (bar, line, pie, area)
- Fetches aggregated data from entity_records
- Renders using a lightweight chart library (e.g., recharts or a custom SVG approach)

### 5.2 — List Widget (`components/widgets/list-widget.tsx`)

- Simple list view of records with configurable fields
- Config: entity, fields to show, filters, limit

### 5.3 — Summary Widget (`components/widgets/summary-widget.tsx`)

- Text-based summary card
- Can show calculated values, percentages, comparisons

### 5.4 — AI Tool for Widget Management

Add tools for the AI to manage widgets:
- `addWidget` — add widget to a page
- `removeWidget` — remove widget from page
- `configureWidget` — modify widget config

### Testing Phase 5

| Test | How | Expected Result |
|------|-----|----------------|
| Bar chart renders | Add chart widget to dashboard via AI | Bar chart showing client counts by status |
| Chart responds to data | Add/remove clients | Chart updates on next load |
| Multiple chart types | "Show me a pie chart of clients by source" | Pie chart renders |
| AI can add widgets | "Add a chart showing clients by status to the dashboard" | Widget appears |
| AI can remove widgets | "Remove the activity feed from the dashboard" | Widget removed |
| Widget error handling | Widget with invalid config | Shows error state, doesn't crash page |

---

## Phase 6: Advanced Views

**Goal**: Build out remaining view types beyond table and board.

### 6.1 — Calendar View (`components/entity/entity-calendar.tsx`)

- Requires a date/datetime field on the entity
- Config: `date_field`, `title_field`
- Renders a month grid with records on their dates
- Click date → create record
- Click record → edit

### 6.2 — Gallery View (`components/entity/entity-gallery.tsx`)

- Card grid layout
- Config: `title_field`, `subtitle_field`, `image_field`, `description_field`
- Shows records as visual cards
- Useful for portfolio items, product catalogs

### 6.3 — Map View (`components/entity/entity-map.tsx`)

- Requires address or lat/lng fields
- Uses a map library (e.g., `react-map-gl` with Mapbox or `leaflet`)
- Shows records as pins on a map
- Click pin → record detail

### 6.4 — List View (`components/entity/entity-list.tsx`)

- Simple list (like a todo list)
- Each row shows configurable fields
- Checkbox support if entity has a checkbox field

### Testing Phase 6

| Test | How | Expected Result |
|------|-----|----------------|
| Calendar renders | Create view via AI: "Show clients on a calendar by their created date" | Calendar grid with records |
| Gallery renders | "Show clients as a gallery" | Card grid layout |
| Map view renders | Add address fields to clients, then "Show clients on a map" | Map with pins |
| View switcher | Toggle between table/board/calendar on same entity | Each renders correctly |
| AI creates advanced views | "Create a calendar view of projects by deadline" | Calendar view created |

---

## Phase 7: Relations & Cross-Entity Features

**Goal**: Enable relationships between entities and cross-entity features.

### 7.1 — Relation Field Type

The `relation` field type links records between entities:
- Config: `{ entity_id: "...", display_field: "name" }`
- In forms: shows a searchable dropdown of records from the related entity
- In tables: shows the display field value as a link
- In detail pages: shows related records in a sub-table

### 7.2 — Detail Pages (`app/(dashboard)/[entity]/[id]/page.tsx`)

Dynamic detail page for any entity record:
- Shows all fields in a form layout
- Related entity records shown in tabs
- Edit in place
- Activity log (created, updated, field changes)

### 7.3 — Cross-Entity Dashboard Widgets

Widgets that span multiple entities:
- "Revenue by Client" (entity_records from invoices, grouped by client relation)
- "Tasks per Project" (cross-entity count)

### Testing Phase 7

| Test | How | Expected Result |
|------|-----|----------------|
| Relation field renders | Add "Primary Contact" relation field to Projects pointing to Clients | Dropdown shows client names |
| Relation displays in table | View projects table | "Primary Contact" column shows client name |
| Detail page renders | Click a client record | Full detail view with all fields |
| Related records | On client detail, see related projects | Sub-table of projects linked to this client |
| AI creates relations | "Add a client field to projects that links to the clients entity" | Relation field created correctly |

---

## Phase 8: Code Generation (DEFERRED — Validate Config-First Approach)

> **This phase is intentionally deprioritized.** The config-driven approach (Phases 1-7) should handle 90%+ of user requests. Before investing in code generation, validate this assumption by tracking what users ask for that config can't handle. If config covers most cases, Phase 8 may never be needed — and you'll have avoided a large security and maintenance surface.
>
> **Why this is risky:**
> - `react-live` has security implications and limited TypeScript support
> - Server-side esbuild compilation + dynamic imports adds significant complexity
> - Both approaches create a large attack surface (arbitrary code execution)
> - Maintaining sandboxed component rendering is an ongoing burden
>
> **When to revisit:** If you're consistently seeing user requests that can't be handled by adding new view types, widget types, or field types to the config system. At that point, consider whether adding a new first-class widget/view type is simpler than building a general code gen pipeline.

### If/When You Build It

The component registry pattern from Phase 3 already supports this — generated components just get registered like any other widget. The pipeline would be:

1. AI generates component code → stored in `custom_components` table
2. Preview in sandpack (sandboxed iframe)
3. User approves → component registered in widget registry
4. Component renders in page layouts

But don't build this until config-driven customization is proven insufficient.

---

## Phase 9: Polish & Production Readiness

**Goal**: Production hardening, performance, and UX polish.

### 9.1 — Rate Limiting
- Rate limit AI chat endpoint (per user, per org)
- Track API cost per organization
- Set configurable limits per plan/tier

### 9.2 — Error Boundaries
- Error boundaries around every widget
- Graceful degradation for failed widget loads
- AI tool error handling with helpful messages

### 9.3 — Loading States
- Skeleton loaders for all server components
- Streaming SSR for dashboard page
- Optimistic updates for record CRUD

### 9.4 — Search
- Global search across all entities
- Quick-search in sidebar (Cmd+K)
- Search within entity tables

### 9.5 — Audit Log
- Track all config changes (who, when, what, AI or human)
- View change history per entity/field/view/page
- Rollback to any previous version

### 9.6 — Multi-user
- Real-time presence (who's viewing what)
- Supabase Realtime for live record updates across users
- Role-based permissions (viewer can't modify configs)

### Testing Phase 9

| Test | How | Expected Result |
|------|-----|----------------|
| Rate limiting | Send 50 rapid AI messages | Rate limit kicks in, helpful error |
| Error boundary | Break a widget config | Error card shown, rest of page works |
| Loading states | Slow network | Skeleton loaders visible |
| Search works | Type client name in search | Matching results appear |
| Audit log | Make several AI changes | All changes logged with descriptions |
| Rollback from audit | Click rollback on a change | Config restored to previous state |
| Multi-user | Two browsers, same org | Both see real-time updates |

---

## Dependency Graph

```
Phase 1 (Foundation)
  ├── Phase 2 (Entity Engine + CRM)
  │     ├── Phase 3 (Views + Layout System)
  │     │     ├── Phase 4 (AI Sidebar)
  │     │     │     ├── Phase 5 (Dashboard Widgets)
  │     │     │     └── Phase 8 (Code Generation)
  │     │     └── Phase 6 (Advanced Views)
  │     └── Phase 7 (Relations)
  └── Phase 9 (Production Polish)
```

**Critical path**: Phase 1 → 2 → 3 → 4 (this gets you to the core differentiator: AI customization)

Phases 5-9 can be built in any order after Phase 4.

---

## Key Architectural Rules

1. **Everything is config**: No hard-coded field names, column lists, or layouts. If it's displayed, it comes from a JSON config in the database.

2. **AI modifies config, not code**: The AI never writes SQL or modifies files. It calls structured tools that modify rows in config tables. The UI re-renders from the new config.

3. **Config before mutation**: Every AI tool call saves a config version snapshot BEFORE making changes. This gives free rollback.

4. **RLS on everything**: Every table has Row Level Security scoped to organization membership. The AI tools use the user's Supabase client, so RLS is enforced automatically.

5. **Server Components for data, Client Components for interaction**: Pages fetch from Supabase as Server Components. Interactive elements (forms, chat, drag-drop) are Client Components that receive data as props.

6. **Field type agnosticism**: Every component that touches entity data must work with ANY field type. Use `FieldRenderer` instead of direct value access.

7. **System fields are protected**: Fields and entities marked `is_system: true` cannot be deleted or have their type changed by the AI.

8. **DB triggers stay minimal**: SQL triggers only handle what MUST happen atomically (org + membership creation). All seeding and complex setup logic lives in application code (`lib/db/seed.ts`) where it's versionable, testable, and modifiable without SQL migrations.

9. **Config-first, code-gen last**: Exhaust what can be done with config (new widget types, view types, field types) before reaching for AI code generation. Adding a new first-class widget to the registry is almost always simpler and safer than generating arbitrary components.

10. **Plan for JSONB performance limits**: GIN indexes handle single-field lookups well but compound filters on JSONB degrade at scale (~5-10K records per entity). When queries slow down, add materialized views or an external search index — don't redesign the data model.
