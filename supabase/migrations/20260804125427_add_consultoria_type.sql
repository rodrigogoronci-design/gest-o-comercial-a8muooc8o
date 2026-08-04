ALTER TABLE public.implementacoes DROP CONSTRAINT IF EXISTS implementacoes_tipo_check;
ALTER TABLE public.implementacoes ADD CONSTRAINT implementacoes_tipo_check
    CHECK (tipo IN ('novo_cliente', 'inclusao_modulo', 'treinamento', 'consultoria'));

ALTER TABLE public.implementacoes DROP CONSTRAINT IF EXISTS implementacoes_status_check;
ALTER TABLE public.implementacoes ADD CONSTRAINT implementacoes_status_check
    CHECK (status IN ('Em andamento', 'Atrasada', 'Finalizada', 'onboarding_completed', 'onboarding_recebido', 'consultoria_recebido', 'consultoria_completed'));

ALTER TABLE public.implementacoes ADD COLUMN IF NOT EXISTS consultoria_titulo TEXT;
ALTER TABLE public.implementacoes ADD COLUMN IF NOT EXISTS consultoria_texto TEXT;
ALTER TABLE public.implementacoes ADD COLUMN IF NOT EXISTS consultoria_form_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.implementacoes ADD COLUMN IF NOT EXISTS consultoria_token UUID DEFAULT gen_random_uuid();

UPDATE public.implementacoes SET consultoria_token = gen_random_uuid() WHERE consultoria_token IS NULL;

CREATE INDEX IF NOT EXISTS idx_implementacoes_consultoria_token
    ON public.implementacoes(consultoria_token)
    WHERE consultoria_token IS NOT NULL;

CREATE OR REPLACE FUNCTION public.get_consultoria_form(p_token uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT jsonb_build_object(
        'id', i.id,
        'status', i.status,
        'cliente_nome', c.nome,
        'cliente_cnpj', c.cnpj,
        'consultoria_titulo', i.consultoria_titulo,
        'consultoria_texto', i.consultoria_texto,
        'consultoria_form_data', i.consultoria_form_data
    )
    FROM public.implementacoes i
    LEFT JOIN public.clientes c ON c.id = i.cliente_id
    WHERE i.consultoria_token = p_token
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.submit_consultoria_form(p_token uuid, p_data jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_impl_id uuid;
BEGIN
    SELECT id INTO v_impl_id FROM public.implementacoes
    WHERE consultoria_token = p_token
      AND status NOT IN ('consultoria_recebido', 'consultoria_completed', 'Finalizada');

    IF v_impl_id IS NULL THEN
        RETURN false;
    END IF;

    UPDATE public.implementacoes
    SET
        consultoria_form_data = p_data,
        status = 'consultoria_recebido',
        consultoria_token = NULL,
        progresso = GREATEST(progresso, 10)
    WHERE id = v_impl_id;

    RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_consultoria_form(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_consultoria_form(uuid, jsonb) TO anon, authenticated;
