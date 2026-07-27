import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { updateDadosParametrizacao } from '@/services/implementacoes'

interface UsePlanFallbackResult {
  planDescription: string
  planCode: string | null
  isLoading: boolean
}

export function usePlanFallback(
  implementacaoId: string | null | undefined,
  dadosParametrizacao: any | null,
  cliente: any | null,
  proposta: any | null,
): UsePlanFallbackResult {
  const primaryDesc = dadosParametrizacao?.plano_descricao || null
  const primaryCode = dadosParametrizacao?.plano_codigo || null

  const [result, setResult] = useState<UsePlanFallbackResult>(() => {
    if (primaryDesc) {
      return {
        planDescription: primaryDesc,
        planCode: primaryCode,
        isLoading: false,
      }
    }
    return {
      planDescription: cliente?.planos_saude?.descricao || 'Plano não identificado',
      planCode: cliente?.planos_saude?.codigo || null,
      isLoading: Boolean(implementacaoId),
    }
  })

  useEffect(() => {
    // Primary Source: if already present in dados_parametrizacao, return immediately
    if (primaryDesc) {
      setResult({
        planDescription: primaryDesc,
        planCode: primaryCode,
        isLoading: false,
      })
      return
    }

    if (!implementacaoId) {
      if (cliente?.planos_saude?.descricao) {
        setResult({
          planDescription: cliente.planos_saude.descricao,
          planCode: cliente.planos_saude.codigo || null,
          isLoading: false,
        })
      } else {
        setResult({
          planDescription: 'Plano não identificado',
          planCode: null,
          isLoading: false,
        })
      }
      return
    }

    let isMounted = true
    setResult((prev) => ({ ...prev, isLoading: true }))

    const resolveAndSavePlan = async () => {
      let resolvedDesc: string | null = null
      let resolvedCode: string | null = null

      // Secondary Source: Client -> planos_saude
      if (cliente?.planos_saude?.descricao) {
        resolvedDesc = cliente.planos_saude.descricao
        resolvedCode = cliente.planos_saude.codigo || null
      } else if (cliente?.plano_id) {
        try {
          const { data: plano } = await supabase
            .from('planos_saude')
            .select('descricao, codigo')
            .eq('id', cliente.plano_id)
            .maybeSingle()
          if (plano?.descricao) {
            resolvedDesc = plano.descricao
            resolvedCode = plano.codigo || null
          }
        } catch {
          /* ignore */
        }
      }

      if (!resolvedDesc && cliente?.id) {
        try {
          const { data: clientDb } = await supabase
            .from('clientes')
            .select('plano_id, planos_saude(descricao, codigo)')
            .eq('id', cliente.id)
            .maybeSingle()

          if (clientDb?.planos_saude && (clientDb.planos_saude as any).descricao) {
            resolvedDesc = (clientDb.planos_saude as any).descricao
            resolvedCode = (clientDb.planos_saude as any).codigo || null
          } else if (clientDb?.plano_id) {
            const { data: plano } = await supabase
              .from('planos_saude')
              .select('descricao, codigo')
              .eq('id', clientDb.plano_id)
              .maybeSingle()
            if (plano?.descricao) {
              resolvedDesc = plano.descricao
              resolvedCode = plano.codigo || null
            }
          }
        } catch {
          /* ignore */
        }
      }

      // Tertiary Source: Proposal / Contract / Prospect
      if (!resolvedDesc) {
        let prospectId = proposta?.prospect_id || null

        if (!prospectId && proposta?.id) {
          try {
            const { data: propDb } = await supabase
              .from('crm_propostas')
              .select('prospect_id')
              .eq('id', proposta.id)
              .maybeSingle()
            if (propDb?.prospect_id) {
              prospectId = propDb.prospect_id
            }
          } catch {
            /* ignore */
          }
        }

        if (prospectId) {
          try {
            const { data: prospect } = await supabase
              .from('crm_prospects')
              .select('plano_apresentado, plano_contratado, plano_id')
              .eq('id', prospectId)
              .maybeSingle()

            if (prospect) {
              if (prospect.plano_id) {
                const { data: plano } = await supabase
                  .from('planos_saude')
                  .select('descricao, codigo')
                  .eq('id', prospect.plano_id)
                  .maybeSingle()
                if (plano?.descricao) {
                  resolvedDesc = plano.descricao
                  resolvedCode = plano.codigo || null
                }
              }
              if (!resolvedDesc) {
                resolvedDesc = prospect.plano_contratado || prospect.plano_apresentado || null
              }
            }
          } catch {
            /* ignore */
          }
        }

        if (!resolvedDesc && cliente?.id) {
          try {
            const { data: prospect } = await supabase
              .from('crm_prospects')
              .select('plano_apresentado, plano_contratado, plano_id')
              .eq('cliente_id', cliente.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()

            if (prospect) {
              if (prospect.plano_id) {
                const { data: plano } = await supabase
                  .from('planos_saude')
                  .select('descricao, codigo')
                  .eq('id', prospect.plano_id)
                  .maybeSingle()
                if (plano?.descricao) {
                  resolvedDesc = plano.descricao
                  resolvedCode = plano.codigo || null
                }
              }
              if (!resolvedDesc) {
                resolvedDesc = prospect.plano_contratado || prospect.plano_apresentado || null
              }
            }
          } catch {
            /* ignore */
          }
        }
      }

      if (!isMounted) return

      if (resolvedDesc) {
        setResult({
          planDescription: resolvedDesc,
          planCode: resolvedCode,
          isLoading: false,
        })

        // Automatic Persistence: Save resolved plan details to implementacoes.dados_parametrizacao
        try {
          const { data: impl } = await supabase
            .from('implementacoes')
            .select('dados_parametrizacao')
            .eq('id', implementacaoId)
            .maybeSingle()

          const currentParams =
            (impl?.dados_parametrizacao as Record<string, any>) || dadosParametrizacao || {}
          const newParams = {
            ...currentParams,
            plano_descricao: resolvedDesc,
            plano_codigo: resolvedCode,
          }

          await updateDadosParametrizacao(implementacaoId, newParams)
        } catch {
          /* ignore */
        }
      } else {
        setResult({
          planDescription: 'Plano não identificado',
          planCode: null,
          isLoading: false,
        })
      }
    }

    resolveAndSavePlan()

    return () => {
      isMounted = false
    }
  }, [
    implementacaoId,
    primaryDesc,
    primaryCode,
    cliente?.id,
    cliente?.plano_id,
    proposta?.id,
    proposta?.prospect_id,
  ])

  return result
}
