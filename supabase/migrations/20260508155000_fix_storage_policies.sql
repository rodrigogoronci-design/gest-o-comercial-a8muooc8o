DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('documentos_clientes', 'documentos_clientes', true)
  ON CONFLICT (id) DO UPDATE SET public = true;
END $$;

DROP POLICY IF EXISTS "Auth ALL documentos_clientes" ON storage.objects;
CREATE POLICY "Auth ALL documentos_clientes" ON storage.objects 
FOR ALL TO authenticated 
USING (bucket_id = 'documentos_clientes') 
WITH CHECK (bucket_id = 'documentos_clientes');

DROP POLICY IF EXISTS "Public Access documentos_clientes" ON storage.objects;
CREATE POLICY "Public Access documentos_clientes" ON storage.objects 
FOR SELECT USING (bucket_id = 'documentos_clientes');
