ALTER TABLE public.crm_prospects ADD COLUMN IF NOT EXISTS plano_id UUID REFERENCES public.planos_saude(id) ON DELETE SET NULL;
ALTER TABLE public.crm_prospects ADD COLUMN IF NOT EXISTS contrato_assinado_url TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('prospect-documents', 'prospect-documents', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "prospect_docs_read" ON storage.objects;
CREATE POLICY "prospect_docs_read" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'prospect-documents');

DROP POLICY IF EXISTS "prospect_docs_insert" ON storage.objects;
CREATE POLICY "prospect_docs_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'prospect-documents');

DROP POLICY IF EXISTS "prospect_docs_delete" ON storage.objects;
CREATE POLICY "prospect_docs_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'prospect-documents');

DROP POLICY IF EXISTS "prospect_docs_update" ON storage.objects;
CREATE POLICY "prospect_docs_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'prospect-documents');
