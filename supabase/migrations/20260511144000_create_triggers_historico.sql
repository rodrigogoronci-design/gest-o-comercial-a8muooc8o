DO $BODY$
BEGIN
  -- 1. Trigger de Solicitacoes para Historico (Gera entrada no Historico e Aditivo)
  CREATE OR REPLACE FUNCTION public.trg_solicitacao_historico()
  RETURNS trigger AS $FUNC$
  BEGIN
    IF NEW.tipo IN ('Treinamento', 'Visita Técnica') THEN
      IF TG_OP = 'INSERT' THEN
        INSERT INTO public.historico_contratos (
          cliente_id, tipo, data_solicitacao, observacoes, valor_adicional, valor_total
        ) VALUES (
          NEW.cliente_id, 
          'Aditivo - ' || NEW.tipo, 
          COALESCE(NEW.data_solicitacao, CURRENT_DATE), 
          NEW.descricao || COALESCE(' - ' || NEW.observacoes, ''),
          COALESCE(NEW.valor, 0),
          COALESCE(NEW.valor, 0)
        );
      ELSIF TG_OP = 'UPDATE' AND (NEW.valor IS DISTINCT FROM OLD.valor OR NEW.status IS DISTINCT FROM OLD.status) THEN
        INSERT INTO public.historico_contratos (
          cliente_id, tipo, data_solicitacao, observacoes, valor_adicional, valor_total
        ) VALUES (
          NEW.cliente_id, 
          'Atualização - ' || NEW.tipo, 
          CURRENT_DATE, 
          'Status: ' || COALESCE(NEW.status, 'Pendente') || ' | ' || NEW.descricao,
          COALESCE(NEW.valor, 0),
          COALESCE(NEW.valor, 0)
        );
      END IF;
    END IF;
    RETURN NEW;
  END;
  $FUNC$ LANGUAGE plpgsql SECURITY DEFINER;

  DROP TRIGGER IF EXISTS on_solicitacao_historico ON public.solicitacoes_servico;
  CREATE TRIGGER on_solicitacao_historico
    AFTER INSERT OR UPDATE ON public.solicitacoes_servico
    FOR EACH ROW EXECUTE FUNCTION public.trg_solicitacao_historico();

  -- 2. Trigger de Agenda para Solicitacoes (Integra a agenda com as solicitacoes)
  CREATE OR REPLACE FUNCTION public.trg_agenda_to_solicitacao()
  RETURNS trigger AS $FUNC$
  BEGIN
    IF NEW.cliente_id IS NOT NULL AND NEW.tipo IN ('Treinamento', 'Visita Técnica') THEN
      IF TG_OP = 'INSERT' THEN
        INSERT INTO public.solicitacoes_servico (
          cliente_id, tipo, descricao, data_solicitacao, observacoes, status, valor
        ) VALUES (
          NEW.cliente_id, NEW.tipo, NEW.titulo, NEW.data_evento::date, COALESCE(NEW.descricao, ''), NEW.status, 0
        );
      END IF;
    END IF;
    RETURN NEW;
  END;
  $FUNC$ LANGUAGE plpgsql SECURITY DEFINER;

  DROP TRIGGER IF EXISTS on_agenda_eventos_created ON public.agenda_eventos;
  CREATE TRIGGER on_agenda_eventos_created
    AFTER INSERT ON public.agenda_eventos
    FOR EACH ROW EXECUTE FUNCTION public.trg_agenda_to_solicitacao();

END;
$BODY$;
