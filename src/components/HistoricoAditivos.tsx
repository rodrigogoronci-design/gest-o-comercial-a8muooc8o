import { useState, useEffect } from 'react'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { CheckCircle2, Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { getHistoricoByCliente, updateHistorico } from '@/services/historico_contratos'

type Historico = {
  id: string
  cliente_id: string
  tipo: string
  data_solicitacao: string
  observacoes: string | null
  valor_adicional: number | null
  modulos: any
  status: string | null
  data_aceite: string | null
}

export function HistoricoAditivos({ clienteId }: { clienteId: string }) {
  const [historico, setHistorico] = useState<Historico[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchHistorico = async () => {
    try {
      setIsLoading(true)
      const data = await getHistoricoByCliente(clienteId)
      setHistorico(data as any)
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar histórico',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (clienteId) {
      fetchHistorico()
    }
  }, [clienteId])

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const payload: any = { status: newStatus }
      if (newStatus === 'Confirmada') {
        payload.data_aceite = new Date().toISOString()
      }

      // Optimistic update
      setHistorico((prev) =>
        prev.map((h) =>
          h.id === id
            ? {
                ...h,
                status: newStatus,
                data_aceite: newStatus === 'Confirmada' ? payload.data_aceite : h.data_aceite,
              }
            : h,
        ),
      )

      await updateHistorico(id, payload)
      toast({ title: 'Status atualizado com sucesso' })
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      })
      fetchHistorico() // revert on error
    }
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'Confirmada':
        return 'bg-emerald-100 text-emerald-800'
      case 'Recusada':
        return 'bg-rose-100 text-rose-800'
      case 'Aguardando retorno':
        return 'bg-amber-100 text-amber-800'
      case 'Enviada':
        return 'bg-sky-100 text-sky-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  const renderModulos = (modulos: any) => {
    if (!modulos) return 'N/A'
    if (Array.isArray(modulos)) {
      if (
        modulos.length > 0 &&
        typeof modulos[0] === 'object' &&
        (modulos[0].nome || modulos[0].name)
      ) {
        return modulos
          .map((m: any) => {
            const name = m.nome || m.name
            const price = m.price !== undefined ? formatCurrency(m.price) : ''
            return price ? `${name} (${price})` : name
          })
          .join(', ')
      }
      return modulos.join(', ')
    }
    return String(modulos)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {historico.length === 0 ? (
        <div className="bg-white p-6 rounded-lg border border-dashed border-slate-200 text-center text-sm text-slate-500">
          Nenhum histórico registrado para este cliente.
        </div>
      ) : (
        historico.map((h) => (
          <div
            key={h.id}
            className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:border-slate-300 shadow-sm"
          >
            <div className="flex-1 flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-full md:w-1/4">
                <div className="font-semibold text-slate-800">{h.tipo}</div>
                <div className="text-xs text-slate-500">{formatDate(h.data_solicitacao)}</div>
              </div>

              <div className="w-full md:w-1/2">
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">
                  Módulos
                </div>
                <div className="text-sm text-slate-700 truncate" title={renderModulos(h.modulos)}>
                  {renderModulos(h.modulos)}
                </div>
              </div>

              <div className="w-full md:w-1/4">
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">
                  Valor
                </div>
                <div className="text-sm font-semibold text-slate-700">
                  {formatCurrency(h.valor_adicional || 0)}
                </div>
              </div>
            </div>

            <div className="w-full md:w-auto flex flex-col items-end shrink-0 gap-2 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 mt-1 md:mt-0">
              <Select
                value={h.status || 'Enviada'}
                onValueChange={(val) => handleStatusChange(h.id, val)}
              >
                <SelectTrigger
                  className={`h-8 w-full md:w-[160px] text-xs font-semibold border-0 ${getStatusColor(h.status)}`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Enviada">Enviada</SelectItem>
                  <SelectItem value="Aguardando retorno">Aguardando retorno</SelectItem>
                  <SelectItem value="Confirmada">Confirmada</SelectItem>
                  <SelectItem value="Recusada">Recusada</SelectItem>
                </SelectContent>
              </Select>

              {h.status === 'Confirmada' && h.data_aceite && (
                <div className="text-right w-full bg-slate-50 p-2.5 rounded-md border border-slate-100 mt-1">
                  <div className="text-xs text-slate-500 mb-1">
                    Aceite realizado em {formatDate(h.data_aceite)}
                  </div>
                  <div className="flex items-center md:justify-end gap-1.5 text-emerald-600 font-medium text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Enviado para implantação/financeiro: Feito</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
