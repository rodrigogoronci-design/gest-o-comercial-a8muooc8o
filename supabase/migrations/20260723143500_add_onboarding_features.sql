ALTER TABLE public.implementacoes ADD COLUMN IF NOT EXISTS token_onboarding UUID DEFAULT gen_random_uuid();

UPDATE public.implementacoes SET token_onboarding = gen_random_uuid() WHERE token_onboarding IS NULL;

ALTER TABLE public.implementacoes DROP CONSTRAINT IF EXISTS implementacoes_status_check;
ALTER TABLE public.implementacoes ADD CONSTRAINT implementacoes_status_check
    CHECK (status IN ('Em andamento', 'Atrasada', 'Finalizada', 'onboarding_completed'));

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
        'proposta_itens', pr.itens
    )
    FROM public.implementacoes i
    LEFT JOIN public.clientes c ON c.id = i.cliente_id
    LEFT JOIN public.planos_saude p ON p.id = c.plano_id
    LEFT JOIN public.crm_propostas pr ON pr.id = i.contrato_id
    WHERE i.token_onboarding = p_token
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.submit_onboarding(
    p_token uuid,
    p_data jsonb,
    p_arquivos jsonb DEFAULT '[]'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_impl_id uuid;
    v_arquivo jsonb;
BEGIN
    SELECT id INTO v_impl_id FROM public.implementacoes
    WHERE token_onboarding = p_token AND status != 'onboarding_completed';

    IF v_impl_id IS NULL THEN
        RETURN false;
    END IF;

    UPDATE public.implementacoes
    SET
        dados_parametrizacao = COALESCE(dados_parametrizacao, '{}'::jsonb) || p_data,
        status = 'onboarding_completed',
        token_onboarding = NULL
    WHERE id = v_impl_id;

    FOR v_arquivo IN SELECT * FROM jsonb_array_elements(p_arquivos)
    LOOP
        INSERT INTO public.implementacao_arquivos
            (implementacao_id, file_path, file_name, file_size, file_type)
        VALUES (
            v_impl_id,
            v_arquivo->>'file_path',
            v_arquivo->>'file_name',
            COALESCE((v_arquivo->>'file_size')::bigint, NULL),
            v_arquivo->>'file_type'
        );
    END LOOP;

    RETURN true;
END;
$;

GRANT EXECUTE ON FUNCTION public.get_implementacao_onboarding(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_onboarding(uuid, jsonb, jsonb) TO anon, authenticated;

DROP POLICY IF EXISTS "implementation_docs_anon_insert" ON storage.objects;
CREATE POLICY "implementation_docs_anon_insert" ON storage.objects
    FOR INSERT TO anon WITH CHECK (bucket_id = 'implementation-docs');
