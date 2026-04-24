ALTER TABLE public.recebimentos ADD COLUMN IF NOT EXISTS contrato TEXT;
ALTER TABLE public.recebimentos ADD COLUMN IF NOT EXISTS numero_titulo TEXT;
ALTER TABLE public.recebimentos ADD COLUMN IF NOT EXISTS data_vencimento DATE;
ALTER TABLE public.recebimentos ADD COLUMN IF NOT EXISTS data_transferencia DATE;
ALTER TABLE public.recebimentos ADD COLUMN IF NOT EXISTS data_retorno DATE;
ALTER TABLE public.recebimentos ADD COLUMN IF NOT EXISTS dias_vencidos INTEGER DEFAULT 0;
ALTER TABLE public.recebimentos ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'EM ABERTO';

ALTER TABLE public.recebimentos ALTER COLUMN valor_pago DROP NOT NULL;
ALTER TABLE public.recebimentos ALTER COLUMN valor_pago SET DEFAULT 0;
ALTER TABLE public.recebimentos ALTER COLUMN valor_titulo DROP NOT NULL;
ALTER TABLE public.recebimentos ALTER COLUMN valor_titulo SET DEFAULT 0;
ALTER TABLE public.recebimentos ALTER COLUMN data_pagamento DROP NOT NULL;
