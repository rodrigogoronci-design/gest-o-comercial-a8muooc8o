-- Adiciona a coluna para armazenar os URLs dos documentos dos clientes
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS documentos_urls JSONB DEFAULT '[]'::jsonb;

-- Cria o bucket de storage para os documentos cadastrais
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('documentos_clientes', 'documentos_clientes', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Politicas de acesso ao storage para o bucket documentos_clientes
DROP POLICY IF EXISTS "Public Access documentos_clientes" ON storage.objects;
CREATE POLICY "Public Access documentos_clientes" ON storage.objects 
FOR SELECT USING (bucket_id = 'documentos_clientes');

DROP POLICY IF EXISTS "Auth Insert documentos_clientes" ON storage.objects;
CREATE POLICY "Auth Insert documentos_clientes" ON storage.objects 
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documentos_clientes');

DROP POLICY IF EXISTS "Auth Update documentos_clientes" ON storage.objects;
CREATE POLICY "Auth Update documentos_clientes" ON storage.objects 
FOR UPDATE TO authenticated USING (bucket_id = 'documentos_clientes');

DROP POLICY IF EXISTS "Auth Delete documentos_clientes" ON storage.objects;
CREATE POLICY "Auth Delete documentos_clientes" ON storage.objects 
FOR DELETE TO authenticated USING (bucket_id = 'documentos_clientes');
