CREATE TABLE IF NOT EXISTS public.historico_contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'Contrato Inicial',
  data_solicitacao DATE NOT NULL DEFAULT CURRENT_DATE,
  plano TEXT,
  modulos JSONB DEFAULT '[]'::jsonb,
  valor_total NUMERIC DEFAULT 0,
  valor_adicional NUMERIC DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.historico_contratos ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
DROP POLICY IF EXISTS "authenticated_select" ON public.historico_contratos;
CREATE POLICY "authenticated_select" ON public.historico_contratos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert" ON public.historico_contratos;
CREATE POLICY "authenticated_insert" ON public.historico_contratos
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update" ON public.historico_contratos;
CREATE POLICY "authenticated_update" ON public.historico_contratos
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete" ON public.historico_contratos;
CREATE POLICY "authenticated_delete" ON public.historico_contratos
  FOR DELETE TO authenticated USING (true);

-- Popular histórico inicial para clientes existentes (Idempotente)
DO $$
BEGIN
  INSERT INTO public.historico_contratos (cliente_id, tipo, data_solicitacao, plano, modulos, valor_total, created_at)
  SELECT 
    id, 
    'Contrato Inicial', 
    (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::DATE, 
    CASE WHEN jsonb_typeof(modulos) = 'object' THEN COALESCE(modulos->>'plano_base', '') ELSE '' END, 
    CASE WHEN jsonb_typeof(modulos) = 'object' THEN COALESCE(modulos->'adicionais', '[]'::jsonb) ELSE COALESCE(modulos, '[]'::jsonb) END, 
    COALESCE(valor_total, 0), 
    created_at
  FROM public.clientes c
  WHERE NOT EXISTS (
    SELECT 1 FROM public.historico_contratos hc WHERE hc.cliente_id = c.id
  );
END $$;
