ALTER TABLE IF EXISTS public.crm_prospects ADD COLUMN IF NOT EXISTS plano_apresentado TEXT;
ALTER TABLE IF EXISTS public.crm_prospects ADD COLUMN IF NOT EXISTS plano_contratado TEXT;
ALTER TABLE IF EXISTS public.crm_prospects ADD COLUMN IF NOT EXISTS modulos_contratados JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.crm_prospects ADD COLUMN IF NOT EXISTS quantidade_uso INTEGER;
ALTER TABLE IF EXISTS public.crm_prospects ADD COLUMN IF NOT EXISTS observacoes_comerciais TEXT;
ALTER TABLE IF EXISTS public.crm_prospects ADD COLUMN IF NOT EXISTS responsavel_comercial TEXT;
ALTER TABLE IF EXISTS public.crm_prospects ADD COLUMN IF NOT EXISTS contrato_assinado BOOLEAN DEFAULT false;

ALTER TABLE public.implementacoes DROP CONSTRAINT IF EXISTS implementacoes_status_check;
ALTER TABLE public.implementacoes ADD CONSTRAINT implementacoes_status_check
    CHECK (status IN ('Aguardando Início', 'Em andamento', 'Atrasada', 'Finalizada', 'Encerrado'));

CREATE OR REPLACE FUNCTION public.trg_proposta_status_to_prospect()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.prospect_id IS NOT NULL THEN
    UPDATE public.crm_prospects
    SET status = 'Proposta Enviada'
    WHERE id = NEW.prospect_id AND status = 'Lead';
  ELSIF TG_OP = 'UPDATE' AND NEW.prospect_id IS NOT NULL
        AND NEW.status_negociacao = 'Aceita'
        AND COALESCE(OLD.status_negociacao, '') != 'Aceita' THEN
    UPDATE public.crm_prospects
    SET status = 'Aguardando Documentação'
    WHERE id = NEW.prospect_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_proposta_insert_prospect_status ON public.crm_propostas;
CREATE TRIGGER on_proposta_insert_prospect_status
  AFTER INSERT ON public.crm_propostas
  FOR EACH ROW EXECUTE FUNCTION public.trg_proposta_status_to_prospect();

DROP TRIGGER IF EXISTS on_proposta_update_prospect_status ON public.crm_propostas;
CREATE TRIGGER on_proposta_update_prospect_status
  AFTER UPDATE OF status_negociacao ON public.crm_propostas
  FOR EACH ROW EXECUTE FUNCTION public.trg_proposta_status_to_prospect();

CREATE OR REPLACE FUNCTION public.trg_prospect_contrato_assinado_handover()
RETURNS trigger AS $$
DECLARE
  existing_client_id uuid;
  new_client_id uuid;
  clean_cnpj text;
  new_impl_id uuid;
BEGIN
  IF NEW.contrato_assinado = true AND COALESCE(OLD.contrato_assinado, false) = false THEN
    IF NEW.cliente_id IS NOT NULL THEN
      existing_client_id := NEW.cliente_id;
    ELSE
      clean_cnpj := COALESCE(NEW.cnpj, '');
      IF clean_cnpj != '' THEN
        SELECT id INTO existing_client_id FROM public.clientes WHERE cnpj = clean_cnpj LIMIT 1;
      END IF;

      IF existing_client_id IS NULL THEN
        INSERT INTO public.clientes (nome, cnpj, email, telefone, endereco, rep_nome, diagnostico, tags, status)
        VALUES (
          NEW.empresa,
          clean_cnpj,
          NEW.email,
          NEW.telefone,
          NEW.endereco,
          NEW.contato_nome,
          COALESCE(NEW.diagnostico, '{}'::jsonb),
          COALESCE(NEW.tags, '[]'::jsonb),
          'Ativo'
        )
        RETURNING id INTO new_client_id;
        existing_client_id := new_client_id;
      END IF;
    END IF;

    NEW.cliente_id := existing_client_id;

    INSERT INTO public.implementacoes (
      cliente_id, status, modulos_novos, tipo, dados_parametrizacao
    )
    VALUES (
      existing_client_id,
      'Aguardando Início',
      COALESCE(NEW.modulos_contratados, '[]'::jsonb),
      'novo_cliente',
      jsonb_build_object(
        'plano_apresentado', NEW.plano_apresentado,
        'plano_contratado', NEW.plano_contratado,
        'quantidade_uso', NEW.quantidade_uso,
        'responsavel_comercial', NEW.responsavel_comercial,
        'observacoes_comerciais', NEW.observacoes_comerciais,
        'contato_nome', NEW.contato_nome,
        'telefone', NEW.telefone,
        'email', NEW.email
      )
    )
    RETURNING id INTO new_impl_id;

    NEW.status := 'Implantação';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_prospect_contrato_assinado ON public.crm_prospects;
CREATE TRIGGER on_prospect_contrato_assinado
  BEFORE UPDATE OF contrato_assinado ON public.crm_prospects
  FOR EACH ROW EXECUTE FUNCTION public.trg_prospect_contrato_assinado_handover();

CREATE OR REPLACE FUNCTION public.trg_implantacao_encerrado_to_prospect()
RETURNS trigger AS $$
DECLARE
  v_prospect_id uuid;
BEGIN
  IF NEW.status = 'Encerrado' AND COALESCE(OLD.status, '') != 'Encerrado' THEN
    SELECT id INTO v_prospect_id FROM public.crm_prospects
    WHERE cliente_id = NEW.cliente_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_prospect_id IS NOT NULL THEN
      UPDATE public.crm_prospects
      SET status = 'Cliente Ativo'
      WHERE id = v_prospect_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_implantacao_encerrado_prospect ON public.implementacoes;
CREATE TRIGGER on_implantacao_encerrado_prospect
  AFTER UPDATE OF status ON public.implementacoes
  FOR EACH ROW EXECUTE FUNCTION public.trg_implantacao_encerrado_to_prospect();

DROP POLICY IF EXISTS "crm_prospects_auth_select" ON public.crm_prospects;
CREATE POLICY "crm_prospects_auth_select" ON public.crm_prospects
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "crm_prospects_auth_insert" ON public.crm_prospects;
CREATE POLICY "crm_prospects_auth_insert" ON public.crm_prospects
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "crm_prospects_auth_update" ON public.crm_prospects;
CREATE POLICY "crm_prospects_auth_update" ON public.crm_prospects
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "crm_prospects_auth_delete" ON public.crm_prospects;
CREATE POLICY "crm_prospects_auth_delete" ON public.crm_prospects
  FOR DELETE TO authenticated USING (true);
