-- Expand entity_type CHECK constraint to support new sections
ALTER TABLE public.ui_configs DROP CONSTRAINT IF EXISTS ui_configs_entity_type_check;
ALTER TABLE public.ui_configs ADD CONSTRAINT ui_configs_entity_type_check
  CHECK (entity_type IN ('contacts','companies','deals','invoices','reports','dashboard'));
