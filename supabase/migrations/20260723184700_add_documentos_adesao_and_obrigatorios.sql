ALTER TABLE IF EXISTS public.crm_prospects
  ADD COLUMN IF NOT EXISTS documentos_adesao JSONB DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.documentos_obrigatorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id UUID REFERENCES public.planos_saude(id) ON DELETE SET NULL,
  nome_documento TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.documentos_obrigatorios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documentos_obrigatorios_select" ON public.documentos_obrigatorios;
CREATE POLICY "documentos_obrigatorios_select" ON public.documentos_obrigatorios
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "documentos_obrigatorios_insert" ON public.documentos_obrigatorios;
CREATE POLICY "documentos_obrigatorios_insert" ON public.documentos_obrigatorios
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "documentos_obrigatorios_update" ON public.documentos_obrigatorios;
CREATE POLICY "documentos_obrigatorios_update" ON public.documentos_obrigatorios
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "documentos_obrigatorios_delete" ON public.documentos_obrigatorios;
CREATE POLICY "documentos_obrigatorios_delete" ON public.documentos_obrigatorios
  FOR DELETE TO authenticated USING (true);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.documentos_obrigatorios LIMIT 1) THEN
    INSERT INTO public.documentos_obrigatorios (nome_documento, descricao) VALUES
      ('CNPJ', 'Cartão CNPJ atualizado'),
      ('Contrato Social', 'Contrato Social e suas alterações'),
      ('RG do Representante Legal', 'Documento de identidade do representante legal'),
      ('CPF do Representante Legal', 'CPF do representante legal'),
      ('Comprovante de Endereço', 'Comprovante de endereço atualizado'),
      ('Certidão Conjunta Negativa de Débitos (Federal, Estadual e Municipal)', 'Certidão negativa de débitos federal, estadual e municipal');
  END IF;
END $$;
