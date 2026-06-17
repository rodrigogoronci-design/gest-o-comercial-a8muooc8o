ALTER TABLE public.solicitacoes_servico ADD COLUMN IF NOT EXISTS documento_url TEXT;

INSERT INTO storage.buckets (id, name, public) VALUES ('client-files', 'client-files', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "client_files_select" ON storage.objects;
CREATE POLICY "client_files_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'client-files');

DROP POLICY IF EXISTS "client_files_insert" ON storage.objects;
CREATE POLICY "client_files_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'client-files');

DROP POLICY IF EXISTS "client_files_update" ON storage.objects;
CREATE POLICY "client_files_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'client-files');

DROP POLICY IF EXISTS "client_files_delete" ON storage.objects;
CREATE POLICY "client_files_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'client-files');
