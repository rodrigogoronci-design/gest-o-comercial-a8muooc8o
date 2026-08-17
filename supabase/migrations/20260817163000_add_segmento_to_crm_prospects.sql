-- Adiciona coluna "segmento" aos prospects de captação, usada para personalizar
-- a mensagem de aproximação enviada junto com o link da apresentação.
ALTER TABLE public.crm_prospects ADD COLUMN IF NOT EXISTS segmento TEXT;
