ALTER TABLE public.crm_prospects ADD COLUMN IF NOT EXISTS diagnostico JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.crm_prospects ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
