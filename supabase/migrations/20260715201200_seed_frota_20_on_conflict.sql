DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'planos_saude_codigo_key'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM (
        SELECT codigo
        FROM public.planos_saude
        WHERE codigo IS NOT NULL AND codigo != ''
        GROUP BY codigo
        HAVING COUNT(*) > 1
      ) dupes
    ) THEN
      ALTER TABLE public.planos_saude ADD CONSTRAINT planos_saude_codigo_key UNIQUE (codigo);
    END IF;
  END IF;
END $$;

INSERT INTO public.planos_saude (codigo, descricao, valor_titular, com_coparticipacao, padrao, franquia_quantidade, valor_excedente)
VALUES ('FROTA_20', 'Frota – Até 20 Placas', 320.00, false, false, 20, 8.00)
ON CONFLICT (codigo) DO NOTHING;
