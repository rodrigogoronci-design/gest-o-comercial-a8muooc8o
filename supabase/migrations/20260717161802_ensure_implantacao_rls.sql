-- Ensure RLS is enabled and policies exist for implementacoes
ALTER TABLE public.implementacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.implementacao_etapas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "implementacoes_all" ON public.implementacoes;
CREATE POLICY "implementacoes_all" ON public.implementacoes
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "implementacao_etapas_all" ON public.implementacao_etapas;
CREATE POLICY "implementacao_etapas_all" ON public.implementacao_etapas
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ensure storage bucket for RAT documents exists
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
