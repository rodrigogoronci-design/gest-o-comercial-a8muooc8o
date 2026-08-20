-- 1. Add 'origem' column to crm_prospects (text, nullable)
ALTER TABLE public.crm_prospects
  ADD COLUMN IF NOT EXISTS origem text;

-- 2. Create crm_prospect_etapa_historico table
CREATE TABLE IF NOT EXISTS public.crm_prospect_etapa_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES public.crm_prospects(id) ON DELETE CASCADE,
  etapa text NOT NULL,
  data_entrada timestamptz NOT NULL DEFAULT now(),
  data_saida timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_crm_prospect_etapa_hist_prospect ON public.crm_prospect_etapa_historico(prospect_id);
CREATE INDEX IF NOT EXISTS idx_crm_prospect_etapa_hist_data_saida ON public.crm_prospect_etapa_historico(prospect_id, data_saida);

-- RLS for crm_prospect_etapa_historico
ALTER TABLE public.crm_prospect_etapa_historico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "crm_prospect_etapa_historico_all_anon" ON public.crm_prospect_etapa_historico;
CREATE POLICY "crm_prospect_etapa_historico_all_anon" ON public.crm_prospect_etapa_historico
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "crm_prospect_etapa_historico_all_auth" ON public.crm_prospect_etapa_historico;
CREATE POLICY "crm_prospect_etapa_historico_all_auth" ON public.crm_prospect_etapa_historico
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger function for stage history tracking
CREATE OR REPLACE FUNCTION public.trg_crm_prospect_etapa_change()
RETURNS trigger AS $$
BEGIN
  -- On INSERT: create initial stage history record
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IS NOT NULL THEN
      INSERT INTO public.crm_prospect_etapa_historico (prospect_id, etapa, data_entrada, data_saida)
      VALUES (NEW.id, NEW.status, now(), NULL);
    END IF;
    RETURN NEW;
  END IF;

  -- On UPDATE: only trigger if status has changed
  IF TG_OP = 'UPDATE' THEN
    IF (OLD.status IS DISTINCT FROM NEW.status) AND (NEW.status IS NOT NULL) THEN
      -- Close open stage records for this prospect where data_saida IS NULL
      UPDATE public.crm_prospect_etapa_historico
      SET data_saida = now()
      WHERE prospect_id = NEW.id AND data_saida IS NULL;

      -- Insert new record for the current new status
      INSERT INTO public.crm_prospect_etapa_historico (prospect_id, etapa, data_entrada, data_saida)
      VALUES (NEW.id, NEW.status, now(), NULL);
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to crm_prospects
DROP TRIGGER IF EXISTS trg_crm_prospect_etapa_change_insert ON public.crm_prospects;
CREATE TRIGGER trg_crm_prospect_etapa_change_insert
  AFTER INSERT ON public.crm_prospects
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_crm_prospect_etapa_change();

DROP TRIGGER IF EXISTS trg_crm_prospect_etapa_change_update ON public.crm_prospects;
CREATE TRIGGER trg_crm_prospect_etapa_change_update
  AFTER UPDATE OF status ON public.crm_prospects
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_crm_prospect_etapa_change();

-- 3. Add 'motivo_perda' and 'motivo_perda_outros' to crm_prospects
ALTER TABLE public.crm_prospects
  ADD COLUMN IF NOT EXISTS motivo_perda text,
  ADD COLUMN IF NOT EXISTS motivo_perda_outros text;
