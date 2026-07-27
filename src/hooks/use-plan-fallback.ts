import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { updateDadosParametrizacao } from '@/services/implementacoes'

interface UsePlanFallbackResult {
  planDescription: string
  planCode: string | null
}

export function usePlanFallback(
  implementacaoId: string | null | undefined,
  dadosParametrizacao: any | null,
  cliente: any | null,
  proposta: any | null,
): UsePlanFallbackResult {
  const [result, setResult] = useState<UsePlanFallbackResult>(() => {
    const desc =
      dadosParametrizacao?.plano_descricao ||
      cliente?.planos_saude?.descricao ||
      'Plano não identificado'
    const code = dadosParametrizacao?.plano_codigo || cliente?.planos_saude?.codigo || null
    return { planDescription: desc, planCode: code }
  })

  useEffect(() => {
    if (!implementacaoId) return

    const cachedDesc = dadosParametrizacao?.plano_descricao ?? null
    const cachedCode = dadosParametrizacao?.plano_codigo ?? null

    if (cachedDesc && cachedCode) return

    let cancelled = false

    const run = async () => {
      let resolvedDesc: string | null = cachedDesc
      let resolvedCode: string | null = cachedCode

      if (!resolvedDesc && cliente?.planos_saude?.descricao) {
        resolvedDesc = cliente.planos_saude.descricao
        resolvedCode = cliente.planos_saude.codigo || null
      }

      if (!resolvedDesc && cliente?.plano_id) {
        try {
          const { data } = await supabase
            .from('planos_saude')
            .select('descricao, codigo')
            .eq('id', cliente.plano_id)
            .maybeSingle()
          if (data) {
            resolvedDesc = data.descricao
            resolvedCode = data.codigo || null
          }
        } catch {
          /* silent */
        }
      }

      if (!resolvedDesc && proposta?.prospect_id) {
        try {
          const { data: prospect } = await supabase
            .from('crm_prospects')
            .select('plano_apresentado, plano_contratado, plano_id')
            .eq('id', proposta.prospect_id)
            .maybeSingle()
          if (prospect) {
            if (prospect.plano_id) {
              const { data: plano } = await supabase
                .from('planos_saude')
                .select('descricao, codigo')
                .eq('id', prospect.plano_id)
                .maybeSingle()
              if (plano) {
                resolvedDesc = plano.descricao
                resolvedCode = plano.codigo || null
              }
            }
            if (!resolvedDesc) {
              resolvedDesc = prospect.plano_contratado || prospect.plano_apresentado || null
            }
          }
        } catch {
          /* silent */
        }
      }

      if (cancelled) return

      if (resolvedDesc) {
        setResult({ planDescription: resolvedDesc, planCode: resolvedCode })
        try {
          await updateDadosParametrizacao(implementacaoId, {
            ...(dadosParametrizacao || {}),
            plano_descricao: resolvedDesc,
            plano_codigo: resolvedCode,
          })
        } catch {
          /* silent */
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [implementacaoId]) // eslint-disable-line react-hooks/exhaustive-deps

  return result
}
