DO $$
BEGIN
  -- Change the default value for new prospects
  ALTER TABLE public.crm_prospects ALTER COLUMN status SET DEFAULT 'Novo Lead';

  -- Map existing statuses to the new standardized statuses
  UPDATE public.crm_prospects 
  SET status = 'Proposta enviada' 
  WHERE status IN ('contrato enviado para assinatura', 'aguardando documentos');

  UPDATE public.crm_prospects 
  SET status = 'Fechado' 
  WHERE status IN ('Contrato assinado', 'Enviado para Implantação', 'Treinamento agendado');

  UPDATE public.crm_prospects 
  SET status = 'Contato inicial' 
  WHERE status IN ('Contato Inicial');

  UPDATE public.crm_prospects 
  SET status = 'Em negociação' 
  WHERE status IN ('Em Negociação', 'Apresentação do sistema', 'Aguardando Feedback');
END $$;
