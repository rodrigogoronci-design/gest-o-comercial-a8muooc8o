ALTER TABLE public.atendimentos_clientes ADD COLUMN IF NOT EXISTS documento_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('atendimentos', 'atendimentos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "atendimentos_public_read" ON storage.objects;
CREATE POLICY "atendimentos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'atendimentos');

DROP POLICY IF EXISTS "atendimentos_authenticated_insert" ON storage.objects;
CREATE POLICY "atendimentos_authenticated_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'atendimentos');

DROP POLICY IF EXISTS "atendimentos_authenticated_update" ON storage.objects;
CREATE POLICY "atendimentos_authenticated_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'atendimentos') WITH CHECK (bucket_id = 'atendimentos');

DROP POLICY IF EXISTS "atendimentos_authenticated_delete" ON storage.objects;
CREATE POLICY "atendimentos_authenticated_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'atendimentos');
