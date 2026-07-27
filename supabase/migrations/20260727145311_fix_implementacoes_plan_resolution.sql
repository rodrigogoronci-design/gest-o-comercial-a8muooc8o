-- Migration: Fix implementation plan resolution and backfill missing plan assignments
DO $$
DECLARE
  v_mts_id uuid;
BEGIN
  -- 1. Locate the MTS-1000 health plan record
  SELECT id INTO v_mts_id FROM public.planos_saude WHERE codigo = 'MTS-1000' OR descricao ILIKE '%MTS-1000%' LIMIT 1;
  
  IF v_mts_id IS NOT NULL THEN
    -- Update client J.M. BERGAMINI if plano_id is null
    UPDATE public.clientes
    SET plano_id = v_mts_id
    WHERE (nome ILIKE '%BERGAMINI%' OR cnpj ILIKE '%13.051.611%') AND plano_id IS NULL;

    -- Backfill for any client linked to prospects with MTS-1000
    UPDATE public.clientes c
    SET plano_id = v_mts_id
    FROM public.crm_prospects p
    WHERE c.id = p.cliente_id
      AND c.plano_id IS NULL
      AND (p.plano_contratado ILIKE '%MTS-1000%' OR p.plano_apresentado ILIKE '%MTS-1000%' OR p.plano_id = v_mts_id);
  END IF;

  -- 2. Backfill dados_parametrizacao in implementacoes for all rows where plano_descricao is missing or unidentified
  UPDATE public.implementacoes i
  SET dados_parametrizacao = COALESCE(i.dados_parametrizacao, '{}'::jsonb) || jsonb_build_object(
    'plano_descricao', ps.descricao,
    'plano_codigo', ps.codigo
  )
  FROM public.clientes c
  JOIN public.planos_saude ps ON ps.id = c.plano_id
  WHERE i.cliente_id = c.id
    AND (
      i.dados_parametrizacao IS NULL 
      OR i.dados_parametrizacao->>'plano_descricao' IS NULL
      OR i.dados_parametrizacao->>'plano_descricao' = ''
      OR i.dados_parametrizacao->>'plano_descricao' = 'Plano não identificado'
    );
END $$;
