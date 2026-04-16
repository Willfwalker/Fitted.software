-- Add metadata jsonb column to CRM tables (companies, contacts, deals)
-- Matches the project convention documented in CLAUDE.md: "metadata jsonb column for extensibility"
-- The action code in lib/actions/{contacts,companies,deals}.ts and the Zod validations in
-- lib/validations/crm.ts already expect this column.

alter table public.companies add column if not exists metadata jsonb;
alter table public.contacts  add column if not exists metadata jsonb;
alter table public.deals     add column if not exists metadata jsonb;
