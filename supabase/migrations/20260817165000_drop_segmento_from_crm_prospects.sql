-- Remove a coluna "segmento" de crm_prospects.
-- A nova mensagem de aproximação não utiliza mais o segmento do prospect;
-- apenas o nome da empresa é usado para personalizar a mensagem.
ALTER TABLE public.crm_prospects DROP COLUMN IF EXISTS segmento;
