DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_propostas' AND column_name = 'valor_anual') THEN
    ALTER TABLE public.crm_propostas ADD COLUMN valor_anual NUMERIC DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_propostas' AND column_name = 'tipo_cobranca') THEN
    ALTER TABLE public.crm_propostas ADD COLUMN tipo_cobranca TEXT DEFAULT 'mensal';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'historico_contratos' AND column_name = 'valor_anual') THEN
    ALTER TABLE public.historico_contratos ADD COLUMN valor_anual NUMERIC DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'valor_anual') THEN
    ALTER TABLE public.clientes ADD COLUMN valor_anual NUMERIC DEFAULT 0;
  END IF;
END $$;
