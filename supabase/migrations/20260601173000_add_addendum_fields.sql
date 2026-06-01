DO $$
BEGIN
  -- Adding tracking fields to crm_propostas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_propostas' AND column_name = 'is_gratuito') THEN
    ALTER TABLE public.crm_propostas ADD COLUMN is_gratuito BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_propostas' AND column_name = 'prazos_concedidos') THEN
    ALTER TABLE public.crm_propostas ADD COLUMN prazos_concedidos TEXT;
  END IF;

  -- Ensure historico_contratos tracks conditions as well
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'historico_contratos' AND column_name = 'prazos_concedidos') THEN
    ALTER TABLE public.historico_contratos ADD COLUMN prazos_concedidos TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'historico_contratos' AND column_name = 'is_gratuito') THEN
    ALTER TABLE public.historico_contratos ADD COLUMN is_gratuito BOOLEAN DEFAULT false;
  END IF;
END $$;
