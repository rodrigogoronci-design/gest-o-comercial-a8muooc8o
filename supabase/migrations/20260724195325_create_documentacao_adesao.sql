CREATE TABLE IF NOT EXISTS public.documentacao_adesao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  item TEXT NOT NULL,
  status TEXT DEFAULT 'Pendente',
  arquivo_url TEXT,
  uploaded_at TIMESTAMPTZ,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.documentacao_status_cliente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE UNIQUE,
  status_geral TEXT DEFAULT 'Aguardando documentação',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.documentacao_adesao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentacao_status_cliente ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documentacao_adesao_select" ON public.documentacao_adesao;
CREATE POLICY "documentacao_adesao_select" ON public.documentacao_adesao
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "documentacao_adesao_insert" ON public.documentacao_adesao;
CREATE POLICY "documentacao_adesao_insert" ON public.documentacao_adesao
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "documentacao_adesao_update" ON public.documentacao_adesao;
CREATE POLICY "documentacao_adesao_update" ON public.documentacao_adesao
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "documentacao_adesao_delete" ON public.documentacao_adesao;
CREATE POLICY "documentacao_adesao_delete" ON public.documentacao_adesao
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "documentacao_status_cliente_select" ON public.documentacao_status_cliente;
CREATE POLICY "documentacao_status_cliente_select" ON public.documentacao_status_cliente
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "documentacao_status_cliente_insert" ON public.documentacao_status_cliente;
CREATE POLICY "documentacao_status_cliente_insert" ON public.documentacao_status_cliente
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "documentacao_status_cliente_update" ON public.documentacao_status_cliente;
CREATE POLICY "documentacao_status_cliente_update" ON public.documentacao_status_cliente
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "documentacao_status_cliente_delete" ON public.documentacao_status_cliente;
CREATE POLICY "documentacao_status_cliente_delete" ON public.documentacao_status_cliente
  FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_documentacao_adesao_cliente_id ON public.documentacao_adesao(cliente_id);
CREATE INDEX IF NOT EXISTS idx_documentacao_status_cliente_cliente_id ON public.documentacao_status_cliente(cliente_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos_adesao', 'documentos_adesao', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow authenticated select on documentos_adesao" ON storage.objects;
CREATE POLICY "Allow authenticated select on documentos_adesao"
  ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documentos_adesao');

DROP POLICY IF EXISTS "Allow authenticated insert on documentos_adesao" ON storage.objects;
CREATE POLICY "Allow authenticated insert on documentos_adesao"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documentos_adesao');

DROP POLICY IF EXISTS "Allow authenticated update on documentos_adesao" ON storage.objects;
CREATE POLICY "Allow authenticated update on documentos_adesao"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documentos_adesao') WITH CHECK (bucket_id = 'documentos_adesao');

DROP POLICY IF EXISTS "Allow authenticated delete on documentos_adesao" ON storage.objects;
CREATE POLICY "Allow authenticated delete on documentos_adesao"
  ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documentos_adesao');

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "documentacao_adesao_updated_at" ON public.documentacao_adesao;
CREATE TRIGGER "documentacao_adesao_updated_at"
  BEFORE UPDATE ON public.documentacao_adesao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS "documentacao_status_cliente_updated_at" ON public.documentacao_status_cliente;
CREATE TRIGGER "documentacao_status_cliente_updated_at"
  BEFORE UPDATE ON public.documentacao_status_cliente
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
