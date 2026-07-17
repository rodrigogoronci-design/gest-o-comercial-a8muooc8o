CREATE TABLE IF NOT EXISTS public.implementacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    contrato_id UUID REFERENCES public.crm_propostas(id) ON DELETE SET NULL,
    responsavel_id UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'Em andamento',
    progresso INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.implementacao_etapas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    implementacao_id UUID NOT NULL REFERENCES public.implementacoes(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    categoria TEXT NOT NULL,
    ordem INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Não iniciada',
    data_prevista DATE,
    data_realizada DATE,
    responsavel_id UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
    observacoes TEXT,
    documento_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'implementacoes_status_check') THEN
        ALTER TABLE public.implementacoes ADD CONSTRAINT implementacoes_status_check
            CHECK (status IN ('Em andamento', 'Atrasada', 'Finalizada'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'implementacao_etapas_status_check') THEN
        ALTER TABLE public.implementacao_etapas ADD CONSTRAINT implementacao_etapas_status_check
            CHECK (status IN ('Não iniciada', 'Agendada', 'Em andamento', 'Concluída', 'Atrasada'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'implementacoes_progresso_check') THEN
        ALTER TABLE public.implementacoes ADD CONSTRAINT implementacoes_progresso_check
            CHECK (progresso >= 0 AND progresso <= 100);
    END IF;
END $$;

ALTER TABLE public.implementacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.implementacao_etapas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "implementacoes_all" ON public.implementacoes;
CREATE POLICY "implementacoes_all" ON public.implementacoes
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "implementacao_etapas_all" ON public.implementacao_etapas;
CREATE POLICY "implementacao_etapas_all" ON public.implementacao_etapas
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_implementacoes_cliente_id ON public.implementacoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_implementacoes_responsavel_id ON public.implementacoes(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_implementacao_etapas_implementacao_id ON public.implementacao_etapas(implementacao_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('implementacao-docs', 'implementacao-docs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "impl_docs_public_read" ON storage.objects;
CREATE POLICY "impl_docs_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'implementacao-docs');

DROP POLICY IF EXISTS "impl_docs_authenticated_insert" ON storage.objects;
CREATE POLICY "impl_docs_authenticated_insert" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'implementacao-docs');

DROP POLICY IF EXISTS "impl_docs_authenticated_update" ON storage.objects;
CREATE POLICY "impl_docs_authenticated_update" ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id = 'implementacao-docs') WITH CHECK (bucket_id = 'implementacao-docs');

DROP POLICY IF EXISTS "impl_docs_authenticated_delete" ON storage.objects;
CREATE POLICY "impl_docs_authenticated_delete" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'implementacao-docs');
