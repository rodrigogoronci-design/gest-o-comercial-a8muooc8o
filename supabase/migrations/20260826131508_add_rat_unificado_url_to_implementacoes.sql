-- Add rat_unificado_url to implementacoes table
ALTER TABLE public.implementacoes
  ADD COLUMN IF NOT EXISTS rat_unificado_url TEXT;
