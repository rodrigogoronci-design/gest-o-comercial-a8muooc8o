ALTER TABLE public.implementacoes ADD COLUMN IF NOT EXISTS cliente_nome TEXT;

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
        'cliente_nome', COALESCE(i.cliente_nome, c.nome),
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
