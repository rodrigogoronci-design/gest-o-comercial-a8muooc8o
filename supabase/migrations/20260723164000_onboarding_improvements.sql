CREATE INDEX IF NOT EXISTS idx_implementacoes_token_onboarding
    ON public.implementacoes(token_onboarding)
    WHERE token_onboarding IS NOT NULL;

ALTER TABLE public.implementacoes DROP CONSTRAINT IF EXISTS implementacoes_status_check;
ALTER TABLE public.implementacoes ADD CONSTRAINT implementacoes_status_check
    CHECK (status IN ('Em andamento', 'Atrasada', 'Finalizada', 'onboarding_completed', 'onboarding_recebido'));

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
    WHERE token_onboarding = p_token
      AND status NOT IN ('onboarding_recebido', 'onboarding_completed');

    IF v_impl_id IS NULL THEN
        RETURN false;
    END IF;

    UPDATE public.implementacoes
    SET
        dados_parametrizacao = COALESCE(dados_parametrizacao, '{}'::jsonb) || p_data,
        status = 'onboarding_recebido',
        token_onboarding = NULL,
        progresso = GREATEST(progresso, 10)
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
$$;

GRANT EXECUTE ON FUNCTION public.submit_onboarding(uuid, jsonb, jsonb) TO anon, authenticated;

ALTER TABLE public.implementacao_arquivos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "implementacao_arquivos_all" ON public.implementacao_arquivos;
CREATE POLICY "implementacao_arquivos_all" ON public.implementacao_arquivos
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "implementation_docs_anon_insert" ON storage.objects;
CREATE POLICY "implementation_docs_anon_insert" ON storage.objects
    FOR INSERT TO anon WITH CHECK (bucket_id = 'implementation-docs');

DROP POLICY IF EXISTS "implementation_docs_public_read" ON storage.objects;
CREATE POLICY "implementation_docs_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'implementation-docs');
