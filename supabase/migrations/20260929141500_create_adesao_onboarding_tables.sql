-- Migration: create_adesao_onboarding_tables
-- Fluxo de onboarding do cliente (ficha de adesao + documentos via link unico)

CREATE TABLE IF NOT EXISTS public.adesao_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    prospect_id UUID REFERENCES public.crm_prospects(id) ON DELETE SET NULL,
    proposta_id UUID REFERENCES public.crm_propostas(id) ON DELETE SET NULL,
    token TEXT NOT NULL UNIQUE,
    expira_em TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'ativo', -- 'ativo', 'expirado', 'revogado', 'concluido'
    dias_validade INTEGER NOT NULL DEFAULT 30,
    criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    criado_por_nome TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adesao_links_token ON public.adesao_links(token);
CREATE INDEX IF NOT EXISTS idx_adesao_links_cliente ON public.adesao_links(cliente_id);
CREATE INDEX IF NOT EXISTS idx_adesao_links_prospect ON public.adesao_links(prospect_id);
CREATE INDEX IF NOT EXISTS idx_adesao_links_status ON public.adesao_links(status);

CREATE TABLE IF NOT EXISTS public.adesao_respostas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID REFERENCES public.adesao_links(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    prospect_id UUID REFERENCES public.crm_prospects(id) ON DELETE SET NULL,
    ficha_dados JSONB NOT NULL DEFAULT '{}'::jsonb,
    status_submissao TEXT NOT NULL DEFAULT 'em_progresso', -- 'em_progresso', 'enviado'
    total_campos INTEGER DEFAULT 0,
    total_arquivos INTEGER DEFAULT 0,
    enviado_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_adesao_respostas_link UNIQUE (link_id)
);

CREATE INDEX IF NOT EXISTS idx_adesao_respostas_cliente ON public.adesao_respostas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_adesao_respostas_link ON public.adesao_respostas(link_id);

CREATE TABLE IF NOT EXISTS public.adesao_arquivos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID REFERENCES public.adesao_links(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    categoria TEXT NOT NULL,
    item_chave TEXT NOT NULL,
    item_label TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    public_url TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_adesao_arquivos_link_item UNIQUE (link_id, item_chave)
);

CREATE INDEX IF NOT EXISTS idx_adesao_arquivos_cliente ON public.adesao_arquivos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_adesao_arquivos_link ON public.adesao_arquivos(link_id);

-- RLS
ALTER TABLE public.adesao_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adesao_respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adesao_arquivos ENABLE ROW LEVEL SECURITY;

-- Politicas para adesao_links
DROP POLICY IF EXISTS "authenticated_all_adesao_links" ON public.adesao_links;
CREATE POLICY "authenticated_all_adesao_links" ON public.adesao_links
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_adesao_links" ON public.adesao_links;
CREATE POLICY "anon_select_adesao_links" ON public.adesao_links
    FOR SELECT TO anon USING (status = 'ativo' AND expira_em > NOW());

-- Politicas para adesao_respostas
DROP POLICY IF EXISTS "authenticated_all_adesao_respostas" ON public.adesao_respostas;
CREATE POLICY "authenticated_all_adesao_respostas" ON public.adesao_respostas
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_adesao_respostas" ON public.adesao_respostas;
CREATE POLICY "anon_select_adesao_respostas" ON public.adesao_respostas
    FOR SELECT TO anon
    USING (
        EXISTS (
            SELECT 1 FROM public.adesao_links l
            WHERE l.id = adesao_respostas.link_id
              AND l.status = 'ativo'
              AND l.expira_em > NOW()
        )
    );

DROP POLICY IF EXISTS "anon_insert_adesao_respostas" ON public.adesao_respostas;
CREATE POLICY "anon_insert_adesao_respostas" ON public.adesao_respostas
    FOR INSERT TO anon
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.adesao_links l
            WHERE l.id = adesao_respostas.link_id
              AND l.status = 'ativo'
              AND l.expira_em > NOW()
        )
    );

DROP POLICY IF EXISTS "anon_update_adesao_respostas" ON public.adesao_respostas;
CREATE POLICY "anon_update_adesao_respostas" ON public.adesao_respostas
    FOR UPDATE TO anon
    USING (
        EXISTS (
            SELECT 1 FROM public.adesao_links l
            WHERE l.id = adesao_respostas.link_id
              AND l.status = 'ativo'
              AND l.expira_em > NOW()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.adesao_links l
            WHERE l.id = adesao_respostas.link_id
              AND l.status = 'ativo'
              AND l.expira_em > NOW()
        )
    );

-- Politicas para adesao_arquivos
DROP POLICY IF EXISTS "authenticated_all_adesao_arquivos" ON public.adesao_arquivos;
CREATE POLICY "authenticated_all_adesao_arquivos" ON public.adesao_arquivos
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_adesao_arquivos" ON public.adesao_arquivos;
CREATE POLICY "anon_select_adesao_arquivos" ON public.adesao_arquivos
    FOR SELECT TO anon
    USING (
        EXISTS (
            SELECT 1 FROM public.adesao_links l
            WHERE l.id = adesao_arquivos.link_id
              AND l.status = 'ativo'
              AND l.expira_em > NOW()
        )
    );

DROP POLICY IF EXISTS "anon_insert_adesao_arquivos" ON public.adesao_arquivos;
CREATE POLICY "anon_insert_adesao_arquivos" ON public.adesao_arquivos
    FOR INSERT TO anon
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.adesao_links l
            WHERE l.id = adesao_arquivos.link_id
              AND l.status = 'ativo'
              AND l.expira_em > NOW()
        )
    );

DROP POLICY IF EXISTS "anon_update_adesao_arquivos" ON public.adesao_arquivos;
CREATE POLICY "anon_update_adesao_arquivos" ON public.adesao_arquivos
    FOR UPDATE TO anon
    USING (
        EXISTS (
            SELECT 1 FROM public.adesao_links l
            WHERE l.id = adesao_arquivos.link_id
              AND l.status = 'ativo'
              AND l.expira_em > NOW()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.adesao_links l
            WHERE l.id = adesao_arquivos.link_id
              AND l.status = 'ativo'
              AND l.expira_em > NOW()
        )
    );

DROP POLICY IF EXISTS "anon_delete_adesao_arquivos" ON public.adesao_arquivos;
CREATE POLICY "anon_delete_adesao_arquivos" ON public.adesao_arquivos
    FOR DELETE TO anon
    USING (
        EXISTS (
            SELECT 1 FROM public.adesao_links l
            WHERE l.id = adesao_arquivos.link_id
              AND l.status = 'ativo'
              AND l.expira_em > NOW()
        )
    );

-- Politica de Storage documentos_adesao para anonimo (upload via link de admissao)
DROP POLICY IF EXISTS "Allow anon insert on documentos_adesao" ON storage.objects;
CREATE POLICY "Allow anon insert on documentos_adesao" ON storage.objects
    FOR INSERT TO anon
    WITH CHECK (bucket_id = 'documentos_adesao');

DROP POLICY IF EXISTS "Allow anon select on documentos_adesao" ON storage.objects;
CREATE POLICY "Allow anon select on documentos_adesao" ON storage.objects
    FOR SELECT TO anon
    USING (bucket_id = 'documentos_adesao');

-- RPC para validar e consultar dados do link (retorna informacoes publicas seguras)
CREATE OR REPLACE FUNCTION public.get_adesao_link_public(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_link public.adesao_links%ROWTYPE;
    v_cliente public.clientes%ROWTYPE;
    v_prospect public.crm_prospects%ROWTYPE;
    v_respostas JSONB;
    v_arquivos JSONB;
    v_client_name TEXT;
    v_client_cnpj TEXT;
    v_client_email TEXT;
    v_client_telefone TEXT;
    v_status TEXT;
BEGIN
    SELECT * INTO v_link FROM public.adesao_links WHERE token = p_token LIMIT 1;
    IF v_link.id IS NULL THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
    END IF;

    -- Verificar expiracao
    IF v_link.expira_em <= NOW() AND v_link.status = 'ativo' THEN
        UPDATE public.adesao_links SET status = 'expirado', atualizado_em = NOW() WHERE id = v_link.id;
        v_link.status := 'expirado';
    END IF;

    IF v_link.status = 'revogado' THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'revogado', 'expira_em', v_link.expira_em);
    END IF;

    IF v_link.status = 'expirado' THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'expirado', 'expira_em', v_link.expira_em);
    END IF;

    IF v_link.cliente_id IS NOT NULL THEN
        SELECT * INTO v_cliente FROM public.clientes WHERE id = v_link.cliente_id;
        v_client_name := v_cliente.nome;
        v_client_cnpj := v_cliente.cnpj;
        v_client_email := v_cliente.email;
        v_client_telefone := v_cliente.telefone;
    ELSIF v_link.prospect_id IS NOT NULL THEN
        SELECT * INTO v_prospect FROM public.crm_prospects WHERE id = v_link.prospect_id;
        v_client_name := COALESCE(v_prospect.razao_social, v_prospect.empresa);
        v_client_cnpj := v_prospect.cnpj;
        v_client_email := v_prospect.email;
        v_client_telefone := v_prospect.telefone;
    END IF;

    SELECT COALESCE(ficha_dados, '{}'::jsonb), status_submissao
    INTO v_respostas, v_status
    FROM public.adesao_respostas
    WHERE link_id = v_link.id;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', id,
            'categoria', categoria,
            'item_chave', item_chave,
            'item_label', item_label,
            'file_name', file_name,
            'file_size', file_size,
            'public_url', public_url,
            'criado_em', criado_em
        )
    ), '[]'::jsonb)
    INTO v_arquivos
    FROM public.adesao_arquivos
    WHERE link_id = v_link.id;

    RETURN jsonb_build_object(
        'valid', true,
        'link_id', v_link.id,
        'token', v_link.token,
        'status', v_link.status,
        'status_submissao', COALESCE(v_status, 'em_progresso'),
        'expira_em', v_link.expira_em,
        'cliente_id', v_link.cliente_id,
        'prospect_id', v_link.prospect_id,
        'cliente_nome', v_client_name,
        'cliente_cnpj', v_client_cnpj,
        'cliente_email', v_client_email,
        'cliente_telefone', v_client_telefone,
        'respostas', COALESCE(v_respostas, '{}'::jsonb),
        'arquivos', v_arquivos
    );
END;
$$;

-- RPC para salvar progresso parcial ou finalizar
CREATE OR REPLACE FUNCTION public.save_adesao_progresso(
    p_token TEXT,
    p_ficha_dados JSONB,
    p_finalizar BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_link public.adesao_links%ROWTYPE;
    v_status_sub TEXT;
    v_resp_id UUID;
    v_total_arquivos INTEGER;
    v_arq RECORD;
    v_cat TEXT;
    v_lbl TEXT;
BEGIN
    SELECT * INTO v_link FROM public.adesao_links WHERE token = p_token LIMIT 1;
    IF v_link.id IS NULL OR v_link.status != 'ativo' OR v_link.expira_em <= NOW() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Link invalido ou expirado');
    END IF;

    v_status_sub := CASE WHEN p_finalizar THEN 'enviado' ELSE 'em_progresso' END;

    SELECT COUNT(*) INTO v_total_arquivos FROM public.adesao_arquivos WHERE link_id = v_link.id;

    INSERT INTO public.adesao_respostas (
        link_id, cliente_id, prospect_id, ficha_dados, status_submissao,
        total_arquivos, enviado_em, atualizado_em
    ) VALUES (
        v_link.id, v_link.cliente_id, v_link.prospect_id, p_ficha_dados, v_status_sub,
        v_total_arquivos,
        CASE WHEN p_finalizar THEN NOW() ELSE NULL END,
        NOW()
    )
    ON CONFLICT (link_id) DO UPDATE SET
        ficha_dados = EXCLUDED.ficha_dados,
        status_submissao = CASE
            WHEN public.adesao_respostas.status_submissao = 'enviado' AND NOT p_finalizar THEN 'enviado'
            ELSE EXCLUDED.status_submissao
        END,
        total_arquivos = v_total_arquivos,
        enviado_em = CASE WHEN p_finalizar THEN NOW() ELSE public.adesao_respostas.enviado_em END,
        atualizado_em = NOW()
    RETURNING id INTO v_resp_id;

    -- Se tiver cliente_id e houver arquivos recebidos, sincronizar com documentacao_adesao
    IF v_link.cliente_id IS NOT NULL THEN
        FOR v_arq IN SELECT * FROM public.adesao_arquivos WHERE link_id = v_link.id LOOP
            -- Tentar sincronizar na tabela documentacao_adesao para a aba Documentacao
            UPDATE public.documentacao_adesao
            SET arquivo_url = v_arq.public_url,
                uploaded_at = v_arq.criado_em,
                status = 'Recebida',
                updated_at = NOW()
            WHERE cliente_id = v_link.cliente_id
              AND (
                  LOWER(item) = LOWER(v_arq.item_label)
                  OR LOWER(item) LIKE '%' || LOWER(v_arq.item_label) || '%'
                  OR LOWER(v_arq.item_label) LIKE '%' || LOWER(item) || '%'
              );
        END LOOP;

        IF p_finalizar THEN
            -- Se todos os itens obrigatorios foram enviados, atualizar status
            PERFORM public.ensure_status_cliente(v_link.cliente_id);
            UPDATE public.documentacao_status_cliente
            SET status_geral = 'Documentação recebida', updated_at = NOW()
            WHERE cliente_id = v_link.cliente_id
              AND status_geral = 'Aguardando documentação';

            UPDATE public.adesao_links
            SET status = 'concluido', atualizado_em = NOW()
            WHERE id = v_link.id;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'resposta_id', v_resp_id,
        'status_submissao', v_status_sub
    );
END;
$$;
