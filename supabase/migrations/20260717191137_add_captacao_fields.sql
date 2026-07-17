DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'crm_prospects' AND column_name = 'tipo_pessoa'
  ) THEN
    ALTER TABLE public.crm_prospects ADD COLUMN tipo_pessoa TEXT DEFAULT 'PJ';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'crm_prospects' AND column_name = 'cpf'
  ) THEN
    ALTER TABLE public.crm_prospects ADD COLUMN cpf TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'crm_prospects' AND column_name = 'razao_social'
  ) THEN
    ALTER TABLE public.crm_prospects ADD COLUMN razao_social TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'crm_prospects' AND column_name = 'nome_mae'
  ) THEN
    ALTER TABLE public.crm_prospects ADD COLUMN nome_mae TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'crm_prospects' AND column_name = 'nome_pai'
  ) THEN
    ALTER TABLE public.crm_prospects ADD COLUMN nome_pai TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'crm_prospects' AND column_name = 'data_nascimento'
  ) THEN
    ALTER TABLE public.crm_prospects ADD COLUMN data_nascimento DATE;
  END IF;
END $$;
