import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Eye, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { CrmPropostaForm, type PropostaFormValues } from './CrmPropostaForm'

export function CrmProspectPropostasTab({
  prospectId,
  prospectName,
}: {
  prospectId: string
  prospectName: string
}) {
  const [propostas, setPropostas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewState, setViewState] = useState<'list' | 'create' | 'view'>('list')
  const [selectedProposta, setSelectedProposta] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const loadPropostas = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('crm_propostas')
      .select('*')
      .eq('prospect_id', prospectId)
      .order('data_proposta', { ascending: false })
    if (data) setPropostas(data)
    setLoading(false)
  }

  useEffect(() => {
    if (viewState === 'list') {
      loadPropostas()
    }
  }, [prospectId, viewState])

  const handleCreateProposta = async (values: PropostaFormValues) => {
    setIsSubmitting(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const { error } = await supabase.from('crm_propostas').insert({
        prospect_id: prospectId,
        user_id: userData.user?.id,
        valor_implantacao: values.valor_implantacao,
        valor_mensalidade: values.valor_mensalidade,
        desconto_mensalidade: values.desconto_mensalidade,
        tipo_desconto: values.tipo_desconto,
        isencao_periodo: values.isencao_periodo,
        quantidade_filiais: values.quantidade_filiais,
        cobrar_filiais: values.cobrar_filiais,
        filiais_detalhes: values.filiais_detalhes,
        aos_cuidados_de: values.aos_cuidados_de || prospectName,
        itens: values.itens || [],
        data_proposta: new Date().toISOString().split('T')[0],
      })

      if (error) throw error

      toast({ title: 'Proposta criada com sucesso' })
      setViewState('list')
    } catch (e: any) {
      toast({ title: 'Erro ao criar proposta', description: e.message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (viewState === 'create') {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b">
          <Button variant="ghost" size="sm" onClick={() => setViewState('list')} className="-ml-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <h3 className="font-semibold text-slate-800">Nova Proposta</h3>
        </div>
        <CrmPropostaForm onSubmit={handleCreateProposta} isSubmitting={isSubmitting} />
      </div>
    )
  }

  if (viewState === 'view' && selectedProposta) {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b">
          <Button variant="ghost" size="sm" onClick={() => setViewState('list')} className="-ml-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <h3 className="font-semibold text-slate-800">Detalhes da Proposta</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-slate-500 block mb-1 text-xs uppercase tracking-wider">Data</span>
            <span className="font-medium text-slate-900">
              {new Date(selectedProposta.data_proposta + 'T12:00:00Z').toLocaleDateString('pt-BR')}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block mb-1 text-xs uppercase tracking-wider">
              Aos cuidados de
            </span>
            <span className="font-medium text-slate-900">
              {selectedProposta.aos_cuidados_de || '-'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block mb-1 text-xs uppercase tracking-wider">
              Mensalidade
            </span>
            <span className="font-semibold text-emerald-600">
              {selectedProposta.valor_mensalidade?.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block mb-1 text-xs uppercase tracking-wider">
              Implantação
            </span>
            <span className="font-semibold text-indigo-600">
              {selectedProposta.valor_implantacao?.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </div>

          {selectedProposta.desconto_mensalidade > 0 && (
            <div className="col-span-2 pt-2">
              <span className="text-slate-500 block mb-1 text-xs uppercase tracking-wider">
                Desconto Aplicado
              </span>
              <span className="font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100 inline-block">
                {selectedProposta.tipo_desconto === 'percentual'
                  ? `${selectedProposta.desconto_mensalidade}%`
                  : selectedProposta.desconto_mensalidade?.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
              </span>
            </div>
          )}

          {selectedProposta.quantidade_filiais > 0 && (
            <div className="col-span-2 border-t border-slate-200 pt-3 mt-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-500 text-xs uppercase tracking-wider font-medium">
                  Filiais ({selectedProposta.quantidade_filiais})
                </span>
                {selectedProposta.cobrar_filiais && (
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                    Cobrança Ativa
                  </span>
                )}
              </div>
              <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                {(selectedProposta.filiais_detalhes || []).map((f: any, i: number) => (
                  <div
                    key={i}
                    className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm"
                  >
                    <span className="font-medium text-slate-800">
                      {f.nome || `Filial ${i + 1}`}
                    </span>
                    <span className="text-slate-500 font-mono text-xs">{f.cnpj}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-center bg-slate-50 p-2 pl-4 rounded-lg border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700">Propostas Enviadas</h3>
        <Button
          size="sm"
          onClick={() => setViewState('create')}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Nova Proposta
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
          <span className="text-sm">Carregando propostas...</span>
        </div>
      ) : propostas.length === 0 ? (
        <div className="py-12 text-center flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <FileText className="h-10 w-10 text-slate-300 mb-3" />
          <p className="font-medium text-slate-700 mb-1">Nenhuma proposta encontrada</p>
          <p className="text-sm text-slate-500 max-w-[250px]">
            Gere uma nova proposta para vincular a este lead no CRM.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {propostas.map((p) => (
            <div
              key={p.id}
              className="p-4 border border-slate-200 rounded-xl bg-white flex justify-between items-center shadow-sm hover:border-indigo-200 hover:shadow-md transition-all group"
            >
              <div className="flex gap-4 items-center">
                <div className="bg-indigo-50 w-10 h-10 rounded-full flex items-center justify-center text-indigo-600 flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm mb-0.5">
                    Proposta de{' '}
                    {new Date(p.data_proposta + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">
                      Mensal:{' '}
                      {p.valor_mensalidade?.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">
                      Implantação:{' '}
                      {p.valor_implantacao?.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedProposta(p)
                  setViewState('view')
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              >
                <Eye className="h-4 w-4 mr-1.5" /> Ver
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
