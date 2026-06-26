import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Eye, FileText, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { CrmPropostaForm, type PropostaFormValues } from './CrmPropostaForm'

export function CrmProspectPropostasTab({
  prospectId,
  clienteId,
  prospectName,
}: {
  prospectId?: string
  clienteId?: string
  prospectName: string
}) {
  const [propostas, setPropostas] = useState<any[]>([])
  const [entityData, setEntityData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [viewState, setViewState] = useState<'list' | 'create' | 'view'>('list')
  const [selectedProposta, setSelectedProposta] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { toast } = useToast()

  const loadPropostas = async () => {
    setLoading(true)
    if (prospectId) {
      const { data: prospectData } = await supabase
        .from('crm_prospects')
        .select('*')
        .eq('id', prospectId)
        .single()
      if (prospectData) setEntityData(prospectData)

      const { data } = await supabase
        .from('crm_propostas')
        .select('*')
        .eq('prospect_id', prospectId)
        .order('created_at', { ascending: false })
      if (data) setPropostas(data)
    } else if (clienteId) {
      const { data: clienteData } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', clienteId)
        .single()
      if (clienteData) setEntityData(clienteData)

      const { data } = await supabase
        .from('crm_propostas')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false })
      if (data) setPropostas(data)
    }
    setLoading(false)
  }

  const handleOpenEmailModal = (p: any) => {
    const subject = encodeURIComponent(`Proposta Comercial - ${prospectName}`)
    const body = encodeURIComponent(
      `Olá ${p.aos_cuidados_de || prospectName},\n\nSegue o link para acesso à nossa proposta comercial:\n${p.documento_url || 'Documento não anexado'}\n\nFicamos à disposição para qualquer dúvida.\n\nAtenciosamente,`,
    )
    const email = entityData?.email || ''

    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank')

    handleUpdateProposta(p.id, {
      status_negociacao: 'Enviada',
      data_envio: new Date().toISOString(),
    })
  }

  useEffect(() => {
    if (viewState === 'list') {
      loadPropostas()
    }
  }, [prospectId, clienteId, viewState])

  const handleUpdateProposta = async (id: string, updates: any) => {
    try {
      const { error } = await supabase.from('crm_propostas').update(updates).eq('id', id)

      if (error) throw error

      setPropostas((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
      toast({ title: 'Proposta atualizada com sucesso' })
    } catch (e: any) {
      toast({ title: 'Erro ao atualizar', description: e.message, variant: 'destructive' })
    }
  }

  const handleCreateProposta = async (values: PropostaFormValues, file: File | null) => {
    setIsSubmitting(true)
    try {
      let documento_url = null
      const targetId = prospectId || clienteId || 'general'

      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${targetId}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('proposals')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage.from('proposals').getPublicUrl(filePath)

        documento_url = publicUrlData.publicUrl
      }

      const { data: userData } = await supabase.auth.getUser()
      const { error } = await supabase.from('crm_propostas').insert({
        prospect_id: prospectId || null,
        cliente_id: clienteId || null,
        user_id: userData.user?.id,
        valor_implantacao: values.valor_implantacao,
        valor_mensalidade: values.valor_mensalidade,
        valor_anual: values.valor_anual,
        tipo_cobranca: values.tipo_cobranca,
        desconto_mensalidade: values.desconto_mensalidade,
        tipo_desconto: values.tipo_desconto,
        isencao_periodo: values.isencao_periodo,
        quantidade_filiais: values.quantidade_filiais,
        cobrar_filiais: values.cobrar_filiais,
        filiais_detalhes: values.filiais_detalhes,
        aos_cuidados_de: values.aos_cuidados_de || prospectName,
        itens: values.itens || [],
        data_proposta: new Date().toISOString().split('T')[0],
        status_negociacao: 'Gerada',
        documento_url,
      })

      if (error) throw error

      toast({ title: 'Proposta salva com sucesso!' })
      setViewState('list')
    } catch (e: any) {
      toast({ title: 'Erro ao salvar proposta', description: e.message, variant: 'destructive' })
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

          {selectedProposta.documento_url ? (
            <div className="col-span-2 pt-2">
              <span className="text-slate-500 block mb-1 text-xs uppercase tracking-wider">
                Documento
              </span>
              <a
                href={selectedProposta.documento_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
              >
                <FileText className="h-4 w-4" />
                Visualizar Proposta em PDF
              </a>
            </div>
          ) : (
            <div className="col-span-2 pt-2">
              <span className="text-slate-500 block mb-1 text-xs uppercase tracking-wider">
                Documento
              </span>
              <span className="text-red-500 text-sm font-medium flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Arquivo não encontrado no armazenamento
              </span>
            </div>
          )}

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
            Gere uma nova proposta para vincular a este {clienteId ? 'cliente' : 'lead'}.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {propostas.map((p) => (
            <div
              key={p.id}
              className="p-4 border border-slate-200 rounded-xl bg-white flex flex-col gap-3 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start">
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
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEmailModal(p)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-2"
                    disabled={!p.documento_url}
                  >
                    <Send className="h-4 w-4 mr-1.5" />
                    Enviar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedProposta(p)
                      setViewState('view')
                    }}
                    className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 h-8 px-2"
                  >
                    <Eye className="h-4 w-4 mr-1.5" /> Ver
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 mt-1">
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-500 uppercase">Status</span>
                  <Select
                    value={p.status_negociacao || 'Gerada'}
                    onValueChange={(val) => handleUpdateProposta(p.id, { status_negociacao: val })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gerada">Gerada</SelectItem>
                      <SelectItem value="Enviada">Enviada</SelectItem>
                      <SelectItem value="Em Análise">Em Análise</SelectItem>
                      <SelectItem value="Aprovada">Aprovada</SelectItem>
                      <SelectItem value="Recusada">Recusada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-500 uppercase">
                    Data de Envio
                  </span>
                  <Input
                    type="datetime-local"
                    className="h-8 text-xs"
                    value={
                      p.data_envio
                        ? new Date(
                            new Date(p.data_envio).getTime() -
                              new Date().getTimezoneOffset() * 60000,
                          )
                            .toISOString()
                            .slice(0, 16)
                        : ''
                    }
                    onChange={(e) => {
                      const val = e.target.value
                      handleUpdateProposta(p.id, {
                        data_envio: val ? new Date(val).toISOString() : null,
                      })
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
