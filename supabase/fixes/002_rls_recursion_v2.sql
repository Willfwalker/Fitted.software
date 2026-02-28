-- ============================================
-- Fix ALL RLS infinite recursion (v2)
-- Drop every policy that self-references organization_members,
-- replace with SECURITY DEFINER helper function.
-- ============================================

-- 1. Create helper functions (bypass RLS)
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_user_admin_org_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT org_id FROM public.organization_members
  WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')
$$;

-- 2. Drop ALL existing policies on organization_members
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'organization_members' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.organization_members', pol.policyname);
  END LOOP;
END $$;

-- 3. Recreate organization_members policies (NO self-reference)
CREATE POLICY "Members can view org members"
  ON public.organization_members FOR SELECT
  USING (org_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Admins can insert members"
  ON public.organization_members FOR INSERT
  WITH CHECK (org_id IN (SELECT public.get_user_admin_org_ids()));

CREATE POLICY "Admins can update members"
  ON public.organization_members FOR UPDATE
  USING (org_id IN (SELECT public.get_user_admin_org_ids()));

CREATE POLICY "Admins can delete members"
  ON public.organization_members FOR DELETE
  USING (org_id IN (SELECT public.get_user_admin_org_ids()));

-- 4. Fix organizations policies
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'organizations' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.organizations', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Members can view their org"
  ON public.organizations FOR SELECT
  USING (id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Owners can update their org"
  ON public.organizations FOR UPDATE
  USING (owner_id = auth.uid());

-- 5. Fix invite_codes policies
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'invite_codes' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.invite_codes', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Anyone can validate invite codes"
  ON public.invite_codes FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage invite codes"
  ON public.invite_codes FOR ALL
  USING (org_id IN (SELECT public.get_user_admin_org_ids()));

-- 6. Fix CRM table policies
-- Companies
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'companies' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.companies', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Org members can view companies"
  ON public.companies FOR SELECT
  USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can create companies"
  ON public.companies FOR INSERT
  WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can update companies"
  ON public.companies FOR UPDATE
  USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Admins can delete companies"
  ON public.companies FOR DELETE
  USING (org_id IN (SELECT public.get_user_admin_org_ids()));

-- Contacts
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'contacts' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.contacts', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Org members can view contacts"
  ON public.contacts FOR SELECT
  USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can create contacts"
  ON public.contacts FOR INSERT
  WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can update contacts"
  ON public.contacts FOR UPDATE
  USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Admins can delete contacts"
  ON public.contacts FOR DELETE
  USING (org_id IN (SELECT public.get_user_admin_org_ids()));

-- Deals
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'deals' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.deals', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Org members can view deals"
  ON public.deals FOR SELECT
  USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can create deals"
  ON public.deals FOR INSERT
  WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can update deals"
  ON public.deals FOR UPDATE
  USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Admins can delete deals"
  ON public.deals FOR DELETE
  USING (org_id IN (SELECT public.get_user_admin_org_ids()));

-- Activities
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'activities' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.activities', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Org members can view activities"
  ON public.activities FOR SELECT
  USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can create activities"
  ON public.activities FOR INSERT
  WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can update activities"
  ON public.activities FOR UPDATE
  USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Admins can delete activities"
  ON public.activities FOR DELETE
  USING (org_id IN (SELECT public.get_user_admin_org_ids()));
