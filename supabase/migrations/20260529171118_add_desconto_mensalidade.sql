DO $$
BEGIN
  ALTER TABLE public.crm_propostas ADD COLUMN IF NOT EXISTS desconto_mensalidade numeric DEFAULT 0;
  ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS desconto_mensalidade numeric DEFAULT 0;
  ALTER TABLE public.historico_contratos ADD COLUMN IF NOT EXISTS desconto_mensalidade numeric DEFAULT 0;
END $$;

DO $$
DECLARE
  v_prospect_id uuid;
  v_user_id uuid;
  v_proposta_id uuid;
BEGIN
  -- Need a prospect
  SELECT id INTO v_prospect_id FROM public.crm_prospects LIMIT 1;
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  IF v_prospect_id IS NOT NULL THEN
    v_proposta_id := gen_random_uuid();
    INSERT INTO public.crm_propostas (
      id, prospect_id, user_id, data_proposta, aos_cuidados_de,
      valor_mensalidade, valor_implantacao, desconto_mensalidade,
      itens
    ) VALUES (
      v_proposta_id, v_prospect_id, v_user_id, CURRENT_DATE, 'Contato Exemplo Semente',
      500, 1000, 50.00,
      '[{"id": "mod-ciot", "name": "Módulo CIOT", "price": 250, "implHours": 4, "tem_gratuidade": true, "periodo_gratuidade": 3}]'::jsonb
    ) ON CONFLICT DO NOTHING;
  END IF;
END $$;
