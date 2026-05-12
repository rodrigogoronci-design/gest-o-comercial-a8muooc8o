ALTER TABLE public.crm_prospects ADD COLUMN IF NOT EXISTS classificacao TEXT DEFAULT 'Frio';

CREATE TABLE IF NOT EXISTS public.crm_historico_interacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES public.crm_prospects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data_interacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tipo_contato TEXT NOT NULL,
  resumo TEXT NOT NULL,
  detalhes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.crm_historico_interacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.crm_historico_interacoes;
CREATE POLICY "Allow all access to authenticated users" ON public.crm_historico_interacoes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to anon users" ON public.crm_historico_interacoes;
CREATE POLICY "Allow all access to anon users" ON public.crm_historico_interacoes
  FOR ALL TO anon USING (true) WITH CHECK (true);
