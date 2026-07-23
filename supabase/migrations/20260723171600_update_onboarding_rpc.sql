CREATE OR REPLACE FUNCTION public.get_implementacao_onboarding(p_token uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT jsonb_build_object(
        'id', i.id,
        'status', i.status,
        'dados_parametrizacao', i.dados_parametrizacao,
        'cliente_nome', c.nome,
        'cliente_cnpj', c.cnpj,
        'plano_descricao', p.descricao,
        'plano_codigo', p.codigo,
        'franquia_quantidade', p.franquia_quantidade,
        'modulos', c.modulos,
        'modulos_novos', i.modulos_novos,
        'proposta_itens', pr.itens
    )
    FROM public.implementacoes i
    LEFT JOIN public.clientes c ON c.id = i.cliente_id
    LEFT JOIN public.planos_saude p ON p.id = c.plano_id
    LEFT JOIN public.crm_propostas pr ON pr.id = i.contrato_id
    WHERE i.token_onboarding = p_token
    LIMIT 1;
$$;
