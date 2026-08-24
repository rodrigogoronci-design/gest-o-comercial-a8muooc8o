-- Migration: Create tables for Service Logic Utilization Module (Fase 1 - Importação e Conferência)
-- Tables: sl_importacoes, sl_utilizacao_mensal, sl_historico_revisoes

-- 1. Table sl_importacoes
CREATE TABLE IF NOT EXISTS public.sl_importacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arquivo_nome text NOT NULL,
  hash_arquivo text NOT NULL,
  competencia varchar(7) NOT NULL, -- AAAA-MM
  total_linhas integer NOT NULL DEFAULT 0,
  linhas_validas integer NOT NULL DEFAULT 0,
  linhas_novas integer NOT NULL DEFAULT 0,
  linhas_identicas integer NOT NULL DEFAULT 0,
  linhas_diferentes integer NOT NULL DEFAULT 0,
  cnpjs_vinculados integer NOT NULL DEFAULT 0,
  cnpjs_nao_localizados integer NOT NULL DEFAULT 0,
  cnpjs_multiplos integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'concluida', -- 'concluida', 'substituida', 'cancelada'
  usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for sl_importacoes
CREATE INDEX IF NOT EXISTS idx_sl_importacoes_hash ON public.sl_importacoes(hash_arquivo);
CREATE INDEX IF NOT EXISTS idx_sl_importacoes_competencia ON public.sl_importacoes(competencia);
CREATE INDEX IF NOT EXISTS idx_sl_importacoes_created_at ON public.sl_importacoes(created_at DESC);

-- 2. Table sl_utilizacao_mensal
CREATE TABLE IF NOT EXISTS public.sl_utilizacao_mensal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  importacao_id uuid NOT NULL REFERENCES public.sl_importacoes(id) ON DELETE RESTRICT,
  cnpj text NOT NULL,
  razao_social text NOT NULL,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  filial_id uuid, -- Para compatibilidade futura ou chave de filial
  base text,
  contratado numeric NOT NULL DEFAULT 0,
  total_emitido numeric NOT NULL DEFAULT 0,
  saldo numeric NOT NULL DEFAULT 0,
  valor_por_doc numeric NOT NULL DEFAULT 0,
  valor_cobranca numeric NOT NULL DEFAULT 0,
  cte numeric NOT NULL DEFAULT 0,
  cte_cancelado numeric NOT NULL DEFAULT 0,
  nfe numeric NOT NULL DEFAULT 0,
  nfe_cancelado numeric NOT NULL DEFAULT 0,
  nfse numeric NOT NULL DEFAULT 0,
  nfse_cancelado numeric NOT NULL DEFAULT 0,
  competencia varchar(7) NOT NULL, -- AAAA-MM
  vigente boolean NOT NULL DEFAULT true,
  divergencia_formula boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique index for vigente = true records (Regra de unicidade corrigida)
CREATE UNIQUE INDEX IF NOT EXISTS uq_sl_utilizacao_vigente
ON public.sl_utilizacao_mensal (cnpj, competencia)
WHERE vigente = true;

-- Indexes for querying sl_utilizacao_mensal
CREATE INDEX IF NOT EXISTS idx_sl_utilizacao_mensal_comp_vig ON public.sl_utilizacao_mensal(competencia, vigente);
CREATE INDEX IF NOT EXISTS idx_sl_utilizacao_mensal_cnpj ON public.sl_utilizacao_mensal(cnpj);
CREATE INDEX IF NOT EXISTS idx_sl_utilizacao_mensal_cliente ON public.sl_utilizacao_mensal(cliente_id);
CREATE INDEX IF NOT EXISTS idx_sl_utilizacao_mensal_importacao ON public.sl_utilizacao_mensal(importacao_id);

-- 3. Table sl_historico_revisoes
CREATE TABLE IF NOT EXISTS public.sl_historico_revisoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  importacao_id_antiga uuid NOT NULL REFERENCES public.sl_importacoes(id) ON DELETE RESTRICT,
  importacao_id_nova uuid NOT NULL REFERENCES public.sl_importacoes(id) ON DELETE RESTRICT,
  utilizacao_id_antigo uuid REFERENCES public.sl_utilizacao_mensal(id) ON DELETE RESTRICT,
  utilizacao_id_novo uuid REFERENCES public.sl_utilizacao_mensal(id) ON DELETE RESTRICT,
  user_id uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  dados_anteriores jsonb NOT NULL DEFAULT '{}'::jsonb,
  dados_novos jsonb NOT NULL DEFAULT '{}'::jsonb,
  motivo text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for sl_historico_revisoes
CREATE INDEX IF NOT EXISTS idx_sl_hist_imp_antiga ON public.sl_historico_revisoes(importacao_id_antiga);
CREATE INDEX IF NOT EXISTS idx_sl_hist_imp_nova ON public.sl_historico_revisoes(importacao_id_nova);
CREATE INDEX IF NOT EXISTS idx_sl_hist_created_at ON public.sl_historico_revisoes(created_at DESC);

-- 4. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.sl_importacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sl_utilizacao_mensal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sl_historico_revisoes ENABLE ROW LEVEL SECURITY;

-- Helper function to check if the current user is an Admin
CREATE OR REPLACE FUNCTION public.sl_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.colaboradores c
    WHERE c.user_id = auth.uid()
      AND c.role = 'Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function to check if current user is authorized (authenticated and NOT restricted/implantação)
CREATE OR REPLACE FUNCTION public.sl_is_authorized_read()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.colaboradores c
    WHERE c.user_id = auth.uid()
      AND c.role IN ('Admin', 'Gestor', 'Colaborador')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- RLS Policies for sl_importacoes:
-- Admin: full access (SELECT, INSERT, UPDATE, DELETE)
-- Authorized users (Gestor, Colaborador): SELECT only
-- Implantação / Anonymous: NO access
DROP POLICY IF EXISTS "sl_importacoes_admin_all" ON public.sl_importacoes;
CREATE POLICY "sl_importacoes_admin_all" ON public.sl_importacoes
  FOR ALL TO authenticated
  USING (public.sl_is_admin())
  WITH CHECK (public.sl_is_admin());

DROP POLICY IF EXISTS "sl_importacoes_authorized_read" ON public.sl_importacoes;
CREATE POLICY "sl_importacoes_authorized_read" ON public.sl_importacoes
  FOR SELECT TO authenticated
  USING (public.sl_is_authorized_read());

-- RLS Policies for sl_utilizacao_mensal:
DROP POLICY IF EXISTS "sl_utilizacao_mensal_admin_all" ON public.sl_utilizacao_mensal;
CREATE POLICY "sl_utilizacao_mensal_admin_all" ON public.sl_utilizacao_mensal
  FOR ALL TO authenticated
  USING (public.sl_is_admin())
  WITH CHECK (public.sl_is_admin());

DROP POLICY IF EXISTS "sl_utilizacao_mensal_authorized_read" ON public.sl_utilizacao_mensal;
CREATE POLICY "sl_utilizacao_mensal_authorized_read" ON public.sl_utilizacao_mensal
  FOR SELECT TO authenticated
  USING (public.sl_is_authorized_read());

-- RLS Policies for sl_historico_revisoes:
DROP POLICY IF EXISTS "sl_historico_revisoes_admin_all" ON public.sl_historico_revisoes;
CREATE POLICY "sl_historico_revisoes_admin_all" ON public.sl_historico_revisoes
  FOR ALL TO authenticated
  USING (public.sl_is_admin())
  WITH CHECK (public.sl_is_admin());

DROP POLICY IF EXISTS "sl_historico_revisoes_authorized_read" ON public.sl_historico_revisoes;
CREATE POLICY "sl_historico_revisoes_authorized_read" ON public.sl_historico_revisoes
  FOR SELECT TO authenticated
  USING (public.sl_is_authorized_read());
