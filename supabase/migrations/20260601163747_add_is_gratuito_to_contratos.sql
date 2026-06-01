DO $$
BEGIN
  ALTER TABLE public.solicitacoes_servico ADD COLUMN IF NOT EXISTS is_gratuito BOOLEAN DEFAULT FALSE;
  ALTER TABLE public.historico_contratos ADD COLUMN IF NOT EXISTS is_gratuito BOOLEAN DEFAULT FALSE;
END $$;

CREATE OR REPLACE FUNCTION public.trg_solicitacao_historico()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_valor_total numeric;
BEGIN
  SELECT valor_total INTO v_valor_total FROM public.clientes WHERE id = NEW.cliente_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.historico_contratos (
      cliente_id, solicitacao_id, tipo, data_solicitacao, observacoes, valor_adicional, valor_total, is_gratuito
    ) VALUES (
      NEW.cliente_id, 
      NEW.id,
      'Solicitação: ' || NEW.tipo, 
      COALESCE(NEW.data_solicitacao, CURRENT_DATE), 
      NEW.descricao || CASE WHEN NEW.observacoes IS NOT NULL AND NEW.observacoes <> '' THEN CHR(10) || 'Obs: ' || NEW.observacoes ELSE '' END,
      COALESCE(NEW.valor, 0),
      COALESCE(v_valor_total, 0),
      NEW.is_gratuito
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF EXISTS (SELECT 1 FROM public.historico_contratos WHERE solicitacao_id = NEW.id) THEN
      UPDATE public.historico_contratos
      SET 
        tipo = 'Solicitação: ' || NEW.tipo,
        data_solicitacao = COALESCE(NEW.data_solicitacao, CURRENT_DATE),
        observacoes = NEW.descricao || CASE WHEN NEW.observacoes IS NOT NULL AND NEW.observacoes <> '' THEN CHR(10) || 'Obs: ' || NEW.observacoes ELSE '' END,
        valor_adicional = COALESCE(NEW.valor, 0),
        is_gratuito = NEW.is_gratuito
      WHERE solicitacao_id = NEW.id;
    ELSE
      INSERT INTO public.historico_contratos (
        cliente_id, solicitacao_id, tipo, data_solicitacao, observacoes, valor_adicional, valor_total, is_gratuito
      ) VALUES (
        NEW.cliente_id, 
        NEW.id,
        'Solicitação: ' || NEW.tipo, 
        COALESCE(NEW.data_solicitacao, CURRENT_DATE), 
        NEW.descricao || CASE WHEN NEW.observacoes IS NOT NULL AND NEW.observacoes <> '' THEN CHR(10) || 'Obs: ' || NEW.observacoes ELSE '' END,
        COALESCE(NEW.valor, 0),
        COALESCE(v_valor_total, 0),
        NEW.is_gratuito
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
