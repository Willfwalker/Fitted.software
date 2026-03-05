-- ============================================
-- Migration: Single-tenant simplification
-- Drop auto-org-creation trigger, add org_exists() RPC
-- ============================================

-- Drop the trigger and function that auto-created orgs on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- RPC to check if any org exists (used by proxy for routing)
CREATE OR REPLACE FUNCTION public.org_exists()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM public.organizations LIMIT 1);
$$;
