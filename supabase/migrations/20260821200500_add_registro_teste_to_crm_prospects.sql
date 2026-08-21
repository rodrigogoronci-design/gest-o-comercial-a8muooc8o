-- Migration: add registro_teste to crm_prospects and mark TESTE QA LEAD
-- Idempotent column addition
ALTER TABLE public.crm_prospects 
ADD COLUMN IF NOT EXISTS registro_teste BOOLEAN DEFAULT FALSE;

-- Ensure default false is set on any existing null rows
UPDATE public.crm_prospects
SET registro_teste = FALSE
WHERE registro_teste IS NULL;

-- Mark test lead specifically
UPDATE public.crm_prospects
SET registro_teste = TRUE
WHERE empresa = 'TESTE QA LEAD';
