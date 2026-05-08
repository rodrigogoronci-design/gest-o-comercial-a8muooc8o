DO $$
BEGIN
  -- Delete duplicate clientes keeping the one with latest created_at
  DELETE FROM public.clientes
  WHERE id IN (
    SELECT id
    FROM (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY cnpj ORDER BY created_at DESC) as rn
      FROM public.clientes
      WHERE cnpj IS NOT NULL AND cnpj != ''
    ) t
    WHERE t.rn > 1
  );

  -- Delete duplicate crm_prospects keeping the one with latest created_at
  DELETE FROM public.crm_prospects
  WHERE id IN (
    SELECT id
    FROM (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY COALESCE(NULLIF(cnpj, ''), empresa) ORDER BY created_at DESC) as rn
      FROM public.crm_prospects
    ) t
    WHERE t.rn > 1
  );
END $$;
