-- ============================================
-- Phase 2 Upgrade: Invoice Enhancements
-- Run this in the Supabase SQL Editor
-- ============================================

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS issue_date date NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS discount_type text CHECK (discount_type IN ('percentage', 'flat')) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS discount_value numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_terms text DEFAULT 'DUE_ON_RECEIPT',
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';
