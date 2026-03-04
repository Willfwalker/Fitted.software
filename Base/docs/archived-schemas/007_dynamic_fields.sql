-- ============================================
-- AI Dynamic Schema Expansion
-- Adds robust JSONB 'custom_fields' column to entities
-- so the AI Command Center can dynamically add fields
-- ============================================

-- Alter Contacts
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Alter Companies
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Alter Deals
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Create an AI Action Log table (Optional, for transparency)
CREATE TABLE IF NOT EXISTS public.ai_schema_mutations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    prompt_used TEXT NOT NULL,
    action_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_schema_org ON public.ai_schema_mutations(org_id);
