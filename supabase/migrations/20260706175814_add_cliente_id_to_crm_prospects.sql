ALTER TABLE public.crm_prospects ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.trg_prospect_to_client()
RETURNS trigger AS $$
DECLARE
  existing_client_id uuid;
  new_client_id uuid;
  clean_cnpj text;
BEGIN
  IF NEW.status = 'Enviado para Implantação'
     AND COALESCE(OLD.status, '') != 'Enviado para Implantação'
     AND NEW.cliente_id IS NULL THEN

    clean_cnpj := COALESCE(NEW.cnpj, '');

    IF clean_cnpj != '' THEN
      SELECT id INTO existing_client_id
      FROM public.clientes
      WHERE cnpj = clean_cnpj
      LIMIT 1;
    END IF;

    IF existing_client_id IS NOT NULL THEN
      NEW.cliente_id := existing_client_id;
    ELSE
      INSERT INTO public.clientes (nome, cnpj, email, telefone, endereco, rep_nome, diagnostico, tags, status)
      VALUES (
        NEW.empresa,
        clean_cnpj,
        NEW.email,
        NEW.telefone,
        NEW.endereco,
        NEW.contato_nome,
        NEW.diagnostico,
        NEW.tags,
        'Ativo'
      )
      RETURNING id INTO new_client_id;

      NEW.cliente_id := new_client_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_prospect_status_to_implantacao ON public.crm_prospects;
CREATE TRIGGER on_prospect_status_to_implantacao
  BEFORE UPDATE ON public.crm_prospects
  FOR EACH ROW EXECUTE FUNCTION public.trg_prospect_to_client();
