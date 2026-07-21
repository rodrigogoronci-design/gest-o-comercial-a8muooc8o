CREATE TABLE IF NOT EXISTS public.implementacao_arquivos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    implementacao_id UUID NOT NULL REFERENCES public.implementacoes(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_implementacao_arquivos_impl_id
    ON public.implementacao_arquivos(implementacao_id);

ALTER TABLE public.implementacao_arquivos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "implementacao_arquivos_all" ON public.implementacao_arquivos;
CREATE POLICY "implementacao_arquivos_all" ON public.implementacao_arquivos
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('implementation-docs', 'implementation-docs', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "implementation_docs_public_read" ON storage.objects;
CREATE POLICY "implementation_docs_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'implementation-docs');

DROP POLICY IF EXISTS "implementation_docs_auth_insert" ON storage.objects;
CREATE POLICY "implementation_docs_auth_insert" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'implementation-docs');

DROP POLICY IF EXISTS "implementation_docs_auth_update" ON storage.objects;
CREATE POLICY "implementation_docs_auth_update" ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id = 'implementation-docs') WITH CHECK (bucket_id = 'implementation-docs');

DROP POLICY IF EXISTS "implementation_docs_auth_delete" ON storage.objects;
CREATE POLICY "implementation_docs_auth_delete" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'implementation-docs');
