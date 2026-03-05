-- Add enabled_modules column to organizations table
-- Default: all modules enabled
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS enabled_modules jsonb
  NOT NULL DEFAULT '["crm","tasks","calendar","invoicing","messaging","files","forms","reports"]';
