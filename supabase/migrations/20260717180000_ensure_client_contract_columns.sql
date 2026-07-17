-- Ensure the `clientes` table has all necessary columns for parsed contract data

DO $$
BEGIN
  -- Add columns if they do not exist
  ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS endereco TEXT;
  ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS plano_id UUID REFERENCES public.planos_saude(id) ON DELETE SET NULL;
  ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS valor_mensalidade NUMERIC DEFAULT 0;
  ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS valor_implantacao NUMERIC DEFAULT 0;
  ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS contrato_url TEXT;
  ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS modulos JSONB DEFAULT '[]'::jsonb;
  ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS data_assinatura DATE;
END $$;
