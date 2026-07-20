-- Add app_source column to colaboradores table
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS app_source text;
