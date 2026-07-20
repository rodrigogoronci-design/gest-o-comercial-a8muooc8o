DO $$
BEGIN
  UPDATE public.clientes c
  SET plano_id = p.id
  FROM public.planos_saude p
  WHERE c.plano_id IS NULL
    AND c.modulos IS NOT NULL
    AND c.modulos->>'plano_base' IS NOT NULL
    AND c.modulos->>'plano_base' != ''
    AND p.codigo LIKE 'ERP-%'
    AND (
      REGEXP_REPLACE(UPPER(c.modulos->>'plano_base'), '[^A-Z0-9]', '') =
        REGEXP_REPLACE(UPPER(REPLACE(p.codigo, 'ERP-', '')), '[^A-Z0-9]', '')
      OR REGEXP_REPLACE(UPPER(c.modulos->>'plano_base'), '[^A-Z0-9]', '') =
        REGEXP_REPLACE(UPPER(p.descricao), '[^A-Z0-9]', '')
      OR UPPER(c.modulos->>'plano_base') = UPPER(p.codigo)
      OR UPPER(c.modulos->>'plano_base') = UPPER(p.descricao)
    );

  UPDATE public.clientes c
  SET plano_id = p.id
  FROM public.planos_saude p
  WHERE c.plano_id IS NULL
    AND c.modulos IS NOT NULL
    AND c.modulos->>'plano_base' IS NOT NULL
    AND UPPER(c.modulos->>'plano_base') LIKE '%5000%'
    AND UPPER(c.modulos->>'plano_base') LIKE '%+%'
    AND p.codigo = 'ERP-TMS-5000-PLUS';
END $$;
