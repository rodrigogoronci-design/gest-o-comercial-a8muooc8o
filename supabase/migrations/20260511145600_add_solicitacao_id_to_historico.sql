-- Add solicitacao_id to historico_contratos to enable ON DELETE CASCADE
ALTER TABLE public.historico_contratos 
  ADD COLUMN IF NOT EXISTS solicitacao_id UUID REFERENCES public.solicitacoes_servico(id) ON DELETE CASCADE;

-- Link existing manual histories to their solicitacoes
DO $DO$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT * FROM public.solicitacoes_servico LOOP
    UPDATE public.historico_contratos
    SET solicitacao_id = rec.id
    WHERE cliente_id = rec.cliente_id
      AND (tipo LIKE '%' || rec.tipo || '%' OR tipo LIKE 'Solicitação: %')
      AND starts_with(observacoes, rec.descricao)
      AND solicitacao_id IS NULL;
  END LOOP;
END $DO$;

-- Drop old trigger if it exists
DROP TRIGGER IF EXISTS on_solicitacao_historico ON public.solicitacoes_servico;

-- Create or replace the unified trigger function
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
      cliente_id, solicitacao_id, tipo, data_solicitacao, observacoes, valor_adicional, valor_total
    ) VALUES (
      NEW.cliente_id, 
      NEW.id,
      'Solicitação: ' || NEW.tipo, 
      COALESCE(NEW.data_solicitacao, CURRENT_DATE), 
      NEW.descricao || CASE WHEN NEW.observacoes IS NOT NULL AND NEW.observacoes <> '' THEN CHR(10) || 'Obs: ' || NEW.observacoes ELSE '' END,
      COALESCE(NEW.valor, 0),
      COALESCE(v_valor_total, 0)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF EXISTS (SELECT 1 FROM public.historico_contratos WHERE solicitacao_id = NEW.id) THEN
      UPDATE public.historico_contratos
      SET 
        tipo = 'Solicitação: ' || NEW.tipo,
        data_solicitacao = COALESCE(NEW.data_solicitacao, CURRENT_DATE),
        observacoes = NEW.descricao || CASE WHEN NEW.observacoes IS NOT NULL AND NEW.observacoes <> '' THEN CHR(10) || 'Obs: ' || NEW.observacoes ELSE '' END,
        valor_adicional = COALESCE(NEW.valor, 0)
      WHERE solicitacao_id = NEW.id;
    ELSE
      INSERT INTO public.historico_contratos (
        cliente_id, solicitacao_id, tipo, data_solicitacao, observacoes, valor_adicional, valor_total
      ) VALUES (
        NEW.cliente_id, 
        NEW.id,
        'Solicitação: ' || NEW.tipo, 
        COALESCE(NEW.data_solicitacao, CURRENT_DATE), 
        NEW.descricao || CASE WHEN NEW.observacoes IS NOT NULL AND NEW.observacoes <> '' THEN CHR(10) || 'Obs: ' || NEW.observacoes ELSE '' END,
        COALESCE(NEW.valor, 0),
        COALESCE(v_valor_total, 0)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Create the trigger mapping
CREATE TRIGGER on_solicitacao_historico
AFTER INSERT OR UPDATE ON public.solicitacoes_servico
FOR EACH ROW EXECUTE FUNCTION public.trg_solicitacao_historico();
