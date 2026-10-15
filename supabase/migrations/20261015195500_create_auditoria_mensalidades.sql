-- Tabela de auditoria para importações e alterações em lote de mensalidades
CREATE TABLE IF NOT EXISTS public.auditoria_mensalidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  cnpj TEXT NOT NULL,
  cliente_nome TEXT,
  valor_anterior NUMERIC(12, 2) NOT NULL DEFAULT 0,
  valor_novo NUMERIC(12, 2) NOT NULL DEFAULT 0,
  origem TEXT NOT NULL DEFAULT 'Importação em lote de mensalidades',
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_mensalidades_cliente_id ON public.auditoria_mensalidades(cliente_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_mensalidades_cnpj ON public.auditoria_mensalidades(cnpj);
CREATE INDEX IF NOT EXISTS idx_auditoria_mensalidades_created_at ON public.auditoria_mensalidades(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.auditoria_mensalidades ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS permissivas e idempotentes para authenticated e anon
DROP POLICY IF EXISTS "auditoria_mensalidades_select_auth" ON public.auditoria_mensalidades;
CREATE POLICY "auditoria_mensalidades_select_auth" ON public.auditoria_mensalidades
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auditoria_mensalidades_insert_auth" ON public.auditoria_mensalidades;
CREATE POLICY "auditoria_mensalidades_insert_auth" ON public.auditoria_mensalidades
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auditoria_mensalidades_select_anon" ON public.auditoria_mensalidades;
CREATE POLICY "auditoria_mensalidades_select_anon" ON public.auditoria_mensalidades
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "auditoria_mensalidades_insert_anon" ON public.auditoria_mensalidades;
CREATE POLICY "auditoria_mensalidades_insert_anon" ON public.auditoria_mensalidades
  FOR INSERT TO anon WITH CHECK (true);
