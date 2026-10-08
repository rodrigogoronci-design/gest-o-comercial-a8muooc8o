-- Migration: Adicionar coluna 'ativo' a public.planos_saude, desativar duplicatas antigas de TMS-30
-- e unificar vínculos de clientes para o plano canônico ERP-TMS-30 (R$ 250,00),
-- preservando estritamente o valor_mensalidade manual dos clientes.

-- 1. Adicionar coluna ativo em planos_saude (default true)
ALTER TABLE public.planos_saude
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;

-- 2. Identificar os IDs dos planos envolvidos
DO $$
DECLARE
  v_canonico_id UUID;
  v_antigo_id UUID;
  v_migrated_count INT := 0;
BEGIN
  -- Obter o ID do registro canônico (ERP-TMS-30)
  SELECT id INTO v_canonico_id
  FROM public.planos_saude
  WHERE codigo = 'ERP-TMS-30'
  LIMIT 1;

  IF v_canonico_id IS NULL THEN
    RAISE EXCEPTION 'Plano canônico ERP-TMS-30 não encontrado em planos_saude';
  END IF;

  -- Obter o ID do registro duplicado antigo ("TMS - 30" com franquia de 28 docs e excedente R$ 0,99)
  SELECT id INTO v_antigo_id
  FROM public.planos_saude
  WHERE codigo = 'TMS - 30'
  LIMIT 1;

  -- 3. Se houver clientes apontando para o registro antigo, migrar para o canônico preservando valor_mensalidade
  IF v_antigo_id IS NOT NULL THEN
    UPDATE public.clientes
    SET plano_id = v_canonico_id
    WHERE plano_id = v_antigo_id;
    GET DIAGNOSTICS v_migrated_count = ROW_COUNT;
    RAISE NOTICE 'Clientes migrados de TMS - 30 para ERP-TMS-30 por plano_id: %', v_migrated_count;

    -- Também atualizar crm_prospects se houver algum apontando para o antigo
    UPDATE public.crm_prospects
    SET plano_id = v_canonico_id
    WHERE plano_id = v_antigo_id;

    -- Desativar o registro duplicado antigo (ativo = false, NUNCA deletar)
    UPDATE public.planos_saude
    SET ativo = false
    WHERE id = v_antigo_id;
    RAISE NOTICE 'Registro duplicado TMS - 30 desativado com sucesso (ativo = false).';
  END IF;

  -- 4. Garantir que o plano canônico ERP-TMS-30 permaneça ativo = true
  UPDATE public.planos_saude
  SET ativo = true
  WHERE id = v_canonico_id;

  -- 5. Se houver clientes cujo JSON modulos->>'plano_base' = 'TMS - 30', normalizar para o canônico
  -- mas SEM ALTERAR valor_mensalidade nem valor_total
  UPDATE public.clientes
  SET modulos = jsonb_set(modulos, '{plano_base}', '"TMS 30"'::jsonb)
  WHERE modulos->>'plano_base' = 'TMS - 30';

END $$;
