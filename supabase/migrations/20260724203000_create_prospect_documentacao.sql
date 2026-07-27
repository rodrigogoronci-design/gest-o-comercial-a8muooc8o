CREATE TABLE IF NOT EXISTS public.prospect_documentacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID REFERENCES public.crm_prospects(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  item TEXT NOT NULL,
  status TEXT DEFAULT 'Aguardando',
  observacoes TEXT,
  arquivo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.prospect_documentacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prospect_documentacao_select" ON public.prospect_documentacao;
CREATE POLICY "prospect_documentacao_select" ON public.prospect_documentacao
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "prospect_documentacao_insert" ON public.prospect_documentacao;
CREATE POLICY "prospect_documentacao_insert" ON public.prospect_documentacao
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "prospect_documentacao_update" ON public.prospect_documentacao;
CREATE POLICY "prospect_documentacao_update" ON public.prospect_documentacao
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "prospect_documentacao_delete" ON public.prospect_documentacao;
CREATE POLICY "prospect_documentacao_delete" ON public.prospect_documentacao
  FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_prospect_documentacao_prospect_id ON public.prospect_documentacao(prospect_id);

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "prospect_documentacao_updated_at" ON public.prospect_documentacao;
CREATE TRIGGER "prospect_documentacao_updated_at"
  BEFORE UPDATE ON public.prospect_documentacao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
