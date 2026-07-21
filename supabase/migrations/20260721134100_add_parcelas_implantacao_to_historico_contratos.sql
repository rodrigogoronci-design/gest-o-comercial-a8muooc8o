ALTER TABLE public.historico_contratos ADD COLUMN IF NOT EXISTS parcelas_implantacao INTEGER NOT NULL DEFAULT 1;
