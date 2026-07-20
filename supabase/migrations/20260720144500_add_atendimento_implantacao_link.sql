-- Add column to track if an atendimento has been sent to implementation
ALTER TABLE public.atendimentos_clientes ADD COLUMN IF NOT EXISTS enviado_implantacao BOOLEAN NOT NULL DEFAULT false;

-- Add column to link implementacoes back to the originating atendimento
ALTER TABLE public.implementacoes ADD COLUMN IF NOT EXISTS atendimento_id UUID REFERENCES public.atendimentos_clientes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_implementacoes_atendimento_id ON public.implementacoes(atendimento_id);
