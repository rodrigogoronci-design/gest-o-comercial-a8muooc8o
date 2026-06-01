-- Create storage bucket for client documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos_clientes', 'documentos_clientes', true) ON CONFLICT (id) DO NOTHING;

-- Setup RLS policies for the new bucket
DROP POLICY IF EXISTS "Allow public read documentos_clientes" ON storage.objects;
CREATE POLICY "Allow public read documentos_clientes" ON storage.objects FOR SELECT USING (bucket_id = 'documentos_clientes');

DROP POLICY IF EXISTS "Allow authenticated insert documentos_clientes" ON storage.objects;
CREATE POLICY "Allow authenticated insert documentos_clientes" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documentos_clientes');

DROP POLICY IF EXISTS "Allow authenticated update documentos_clientes" ON storage.objects;
CREATE POLICY "Allow authenticated update documentos_clientes" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'documentos_clientes');

DROP POLICY IF EXISTS "Allow authenticated delete documentos_clientes" ON storage.objects;
CREATE POLICY "Allow authenticated delete documentos_clientes" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documentos_clientes');
