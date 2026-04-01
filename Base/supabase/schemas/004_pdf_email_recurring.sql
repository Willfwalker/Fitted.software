-- ============================================
-- Phase 3: PDF Export, Email Delivery & Recurring Invoices
-- Run in Supabase SQL Editor
-- ============================================

-- 0. Extend activity_type enum with new values
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'INVOICE_SENT';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'INVOICE_RECURRING_CREATED';

-- 1. Add share_token to invoices for public share links
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS share_token uuid DEFAULT NULL UNIQUE;

CREATE INDEX IF NOT EXISTS idx_invoices_share_token
  ON public.invoices(share_token) WHERE share_token IS NOT NULL;

-- Share-token-based invoice access is handled by admin-client server routes
-- (e.g. /invoices/[id]/public, PDF generation) which bypass RLS.
-- No anon RLS policy is needed here — removing the tautological policy
-- that previously exposed all shared invoices to any anon caller.

-- 2. Recurring invoices table
CREATE TABLE IF NOT EXISTS public.recurring_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source_invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  frequency text NOT NULL CHECK (frequency IN ('WEEKLY','BIWEEKLY','MONTHLY','QUARTERLY','YEARLY')),
  next_run_date date NOT NULL,
  end_date date DEFAULT NULL,
  runs_count integer NOT NULL DEFAULT 0,
  max_runs integer DEFAULT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','PAUSED','COMPLETED')),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recurring_invoices_org
  ON public.recurring_invoices(org_id);

CREATE INDEX IF NOT EXISTS idx_recurring_invoices_status_date
  ON public.recurring_invoices(status, next_run_date)
  WHERE status = 'ACTIVE';

-- Updated_at trigger (reuses existing function)
CREATE TRIGGER recurring_invoices_updated_at
  BEFORE UPDATE ON public.recurring_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE public.recurring_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view recurring invoices"
  ON public.recurring_invoices FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can create recurring invoices"
  ON public.recurring_invoices FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can update recurring invoices"
  ON public.recurring_invoices FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can delete recurring invoices"
  ON public.recurring_invoices FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()
  ));
