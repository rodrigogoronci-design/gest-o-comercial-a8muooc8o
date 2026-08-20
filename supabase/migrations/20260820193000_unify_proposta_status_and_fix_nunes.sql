-- Migration M1 e M2: Unificar status 'Proposta enviada' -> 'Proposta Enviada', atualizar trigger trg_proposta_status_to_prospect e corrigir DISTRIBUIDORA NUNES

-- M1: Salvar IDs para rollback e unificar status em crm_prospects
CREATE TEMP TABLE IF NOT EXISTS rollback_m1_proposta_status AS
SELECT id, status FROM public.crm_prospects WHERE status = 'Proposta enviada';

UPDATE public.crm_prospects SET status = 'Proposta Enviada' WHERE status = 'Proposta enviada';

-- Atualizar trigger trg_proposta_status_to_prospect para garantir inserção/atualização correta
-- Lógica:
-- 1) No INSERT com prospect_id, se prospect não estiver em status final ('Cliente Efetivado', 'Perdido', 'Cliente Ativo'), atualiza para 'Proposta Enviada' (se status_negociacao in ('Enviada', 'Aprovada') ou inserção inicial de proposta)
-- 2) No UPDATE de status_negociacao:
--    - Se mudar para 'Enviada' ou 'Aprovada' -> atualiza crm_prospects.status para 'Proposta Enviada' (exceto status final)
--    - Se mudar para 'Aceita' -> atualiza crm_prospects.status para 'Aguardando Documentação' (exceto status final)
CREATE OR REPLACE FUNCTION public.trg_proposta_status_to_prospect()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.prospect_id IS NOT NULL THEN
    UPDATE public.crm_prospects
    SET status = 'Proposta Enviada'
    WHERE id = NEW.prospect_id 
      AND status NOT IN ('Cliente Efetivado', 'Perdido', 'Cliente Ativo');
  ELSIF TG_OP = 'UPDATE' AND NEW.prospect_id IS NOT NULL THEN
    IF NEW.status_negociacao IN ('Enviada', 'Aprovada')
       AND COALESCE(OLD.status_negociacao, '') NOT IN ('Enviada', 'Aprovada') THEN
      UPDATE public.crm_prospects
      SET status = 'Proposta Enviada'
      WHERE id = NEW.prospect_id
        AND status NOT IN ('Cliente Efetivado', 'Perdido', 'Cliente Ativo');
    ELSIF NEW.status_negociacao = 'Aceita'
          AND COALESCE(OLD.status_negociacao, '') != 'Aceita' THEN
      UPDATE public.crm_prospects
      SET status = 'Aguardando Documentação'
      WHERE id = NEW.prospect_id
        AND status NOT IN ('Cliente Efetivado', 'Perdido', 'Cliente Ativo');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que os triggers estejam ativos na tabela crm_propostas
DROP TRIGGER IF EXISTS on_proposta_insert_prospect_status ON public.crm_propostas;
CREATE TRIGGER on_proposta_insert_prospect_status
  AFTER INSERT ON public.crm_propostas
  FOR EACH ROW EXECUTE FUNCTION public.trg_proposta_status_to_prospect();

DROP TRIGGER IF EXISTS on_proposta_update_prospect_status ON public.crm_propostas;
CREATE TRIGGER on_proposta_update_prospect_status
  AFTER UPDATE OF status_negociacao ON public.crm_propostas
  FOR EACH ROW EXECUTE FUNCTION public.trg_proposta_status_to_prospect();

-- M2: Corrigir DISTRIBUIDORA NUNES (e qualquer prospect com propostas Enviadas/Aprovadas vinculadas)
UPDATE public.crm_prospects
SET status = 'Proposta Enviada'
WHERE id IN (
  SELECT DISTINCT p.id
  FROM public.crm_prospects p
  JOIN public.crm_propostas prop ON prop.prospect_id = p.id
  WHERE prop.status_negociacao IN ('Enviada', 'Aprovada')
    AND p.status NOT IN ('Cliente Efetivado', 'Perdido', 'Cliente Ativo')
);
