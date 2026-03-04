-- ============================================
-- Fix RLS infinite recursion
-- The organization_members SELECT policy references itself,
-- and CRM table policies also query organization_members,
-- causing infinite recursion. Fix: use a SECURITY DEFINER
-- function that bypasses RLS to get the user's org IDs.
-- ============================================

-- 1. Create helper function (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()
$$;

-- 2. Fix organization_members policies
DROP POLICY IF EXISTS "Members can view org members" ON public.organization_members;
CREATE POLICY "Members can view org members"
  ON public.organization_members FOR SELECT
  USING (org_id IN (SELECT public.get_user_org_ids()));

DROP POLICY IF EXISTS "Owners and admins can manage members" ON public.organization_members;
CREATE POLICY "Owners and admins can manage members"
  ON public.organization_members FOR ALL
  USING (org_id IN (
    SELECT om.org_id FROM public.organization_members om
    WHERE om.user_id = auth.uid() AND om.role IN ('OWNER', 'ADMIN')
  ));

-- 3. Fix organizations policies
DROP POLICY IF EXISTS "Members can view their org" ON public.organizations;
CREATE POLICY "Members can view their org"
  ON public.organizations FOR SELECT
  USING (id IN (SELECT public.get_user_org_ids()));

-- 4. Fix CRM table policies to use the helper
-- Companies
DROP POLICY IF EXISTS "Org members can view companies" ON public.companies;
CREATE POLICY "Org members can view companies"
  ON public.companies FOR SELECT
  USING (org_id IN (SELECT public.get_user_org_ids()));

DROP POLICY IF EXISTS "Org members can create companies" ON public.companies;
CREATE POLICY "Org members can create companies"
  ON public.companies FOR INSERT
  WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));

DROP POLICY IF EXISTS "Org members can update companies" ON public.companies;
CREATE POLICY "Org members can update companies"
  ON public.companies FOR UPDATE
  USING (org_id IN (SELECT public.get_user_org_ids()));

DROP POLICY IF EXISTS "Owners and admins can delete companies" ON public.companies;
CREATE POLICY "Owners and admins can delete companies"
  ON public.companies FOR DELETE
  USING (org_id IN (
    SELECT om.org_id FROM public.organization_members om
    WHERE om.user_id = auth.uid() AND om.role IN ('OWNER', 'ADMIN')
  ));

-- Contacts
DROP POLICY IF EXISTS "Org members can view contacts" ON public.contacts;
CREATE POLICY "Org members can view contacts"
  ON public.contacts FOR SELECT
  USING (org_id IN (SELECT public.get_user_org_ids()));

DROP POLICY IF EXISTS "Org members can create contacts" ON public.contacts;
CREATE POLICY "Org members can create contacts"
  ON public.contacts FOR INSERT
  WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));

DROP POLICY IF EXISTS "Org members can update contacts" ON public.contacts;
CREATE POLICY "Org members can update contacts"
  ON public.contacts FOR UPDATE
  USING (org_id IN (SELECT public.get_user_org_ids()));

DROP POLICY IF EXISTS "Owners and admins can delete contacts" ON public.contacts;
CREATE POLICY "Owners and admins can delete contacts"
  ON public.contacts FOR DELETE
  USING (org_id IN (
    SELECT om.org_id FROM public.organization_members om
    WHERE om.user_id = auth.uid() AND om.role IN ('OWNER', 'ADMIN')
  ));

-- Deals
DROP POLICY IF EXISTS "Org members can view deals" ON public.deals;
CREATE POLICY "Org members can view deals"
  ON public.deals FOR SELECT
  USING (org_id IN (SELECT public.get_user_org_ids()));

DROP POLICY IF EXISTS "Org members can create deals" ON public.deals;
CREATE POLICY "Org members can create deals"
  ON public.deals FOR INSERT
  WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));

DROP POLICY IF EXISTS "Org members can update deals" ON public.deals;
CREATE POLICY "Org members can update deals"
  ON public.deals FOR UPDATE
  USING (org_id IN (SELECT public.get_user_org_ids()));

DROP POLICY IF EXISTS "Owners and admins can delete deals" ON public.deals;
CREATE POLICY "Owners and admins can delete deals"
  ON public.deals FOR DELETE
  USING (org_id IN (
    SELECT om.org_id FROM public.organization_members om
    WHERE om.user_id = auth.uid() AND om.role IN ('OWNER', 'ADMIN')
  ));

-- Activities
DROP POLICY IF EXISTS "Org members can view activities" ON public.activities;
CREATE POLICY "Org members can view activities"
  ON public.activities FOR SELECT
  USING (org_id IN (SELECT public.get_user_org_ids()));

DROP POLICY IF EXISTS "Org members can create activities" ON public.activities;
CREATE POLICY "Org members can create activities"
  ON public.activities FOR INSERT
  WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));

DROP POLICY IF EXISTS "Org members can update activities" ON public.activities;
CREATE POLICY "Org members can update activities"
  ON public.activities FOR UPDATE
  USING (org_id IN (SELECT public.get_user_org_ids()));

DROP POLICY IF EXISTS "Owners and admins can delete activities" ON public.activities;
CREATE POLICY "Owners and admins can delete activities"
  ON public.activities FOR DELETE
  USING (org_id IN (
    SELECT om.org_id FROM public.organization_members om
    WHERE om.user_id = auth.uid() AND om.role IN ('OWNER', 'ADMIN')
  ));
