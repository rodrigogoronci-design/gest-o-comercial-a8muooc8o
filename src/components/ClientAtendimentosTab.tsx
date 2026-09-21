import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Plus,
  Calendar,
  MessageSquare,
  Trash2,
  ChevronRight,
  ChevronDown,
  Paperclip,
  Rocket,
  CheckCircle2,
  Mail,
  User,
  ArrowDownLeft,
  ArrowUpRight,
  Layers,
} from 'lucide-react'
import { AtendimentoFormDialog } from '@/components/AtendimentoFormDialog'
import { AtendimentoDetailDialog } from '@/components/AtendimentoDetailDialog'
import { EnviarImplantacaoFromAtendimentoDialog } from '@/components/EnviarImplantacaoFromAtendimentoDialog'
import {
  getAtendimentosByCliente,
  deleteAtendimento,
  type Atendimento,
} from '@/services/atendimentos'
import { formatDate } from '@/lib/formatters'
import { toast } from 'sonner'

interface ClientAtendimentosTabProps {
  clienteId: string
  clientName: string
}

export function ClientAtendimentosTab({ clienteId, clientName }: ClientAtendimentosTabProps) {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedAtendimento, setSelectedAtendimento] = useState<Atendimento | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [implantacaoAtendimento, setImplantacaoAtendimento] = useState<Atendimento | null>(null)
  const [isImplantacaoOpen, setIsImplantacaoOpen] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const loadAtendimentos = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getAtendimentosByCliente(clienteId)
      setAtendimentos(data)
    } catch (error: any) {
      toast.error('Erro ao carregar atendimentos: ' + (error.message || ''))
    } finally {
      setIsLoading(false)
    }
  }, [clienteId])

  useEffect(() => {
    loadAtendimentos()
  }, [loadAtendimentos])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este atendimento?')) return
    try {
      await deleteAtendimento(id)
      toast.success('Atendimento excluído com sucesso!')
      loadAtendimentos()
    } catch (error: any) {
      toast.error('Erro ao excluir atendimento: ' + (error.message || ''))
    }
  }

  const handleOpenDetail = (atendimento: Atendimento) => {
    setSelectedAtendimento(atendimento)
    setIsDetailOpen(true)
  }

  const handleOpenImplantacao = (atendimento: Atendimento) => {
    setImplantacaoAtendimento(atendimento)
    setIsImplantacaoOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Histórico de Atendimentos</h3>
          <p className="text-sm text-slate-500">
            Registro de interações, reuniões e solicitações de {clientName}
          </p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" /> Adicionar Atendimento
        </Button>
      </div>

      <AtendimentoFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        clienteId={clienteId}
        onSaved={loadAtendimentos}
      />

      <AtendimentoDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        atendimento={selectedAtendimento}
      />

      <EnviarImplantacaoFromAtendimentoDialog
        open={isImplantacaoOpen}
        onOpenChange={setIsImplantacaoOpen}
        atendimento={implantacaoAtendimento}
        clienteId={clienteId}
        onSent={loadAtendimentos}
      />

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : atendimentos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
          <MessageSquare className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm text-slate-500 font-medium">Nenhum atendimento registrado</p>
          <p className="text-xs text-slate-400 mt-1">
            Clique em "Adicionar Atendimento" para começar.
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          {atendimentos.map((atendimento, index) => {
            const isImported = Boolean(atendimento.origem)
            const isExpanded = !!expandedIds[atendimento.id]
            const anexosCount = Array.isArray(atendimento.anexos)
              ? atendimento.anexos.length
              : atendimento.documento_url
                ? 1
                : 0

            if (!isImported) {
              // Atendimento manual idêntico a hoje
              return (
                <div
                  key={atendimento.id}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group ${
                    index !== atendimentos.length - 1 ? 'border-b border-slate-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs text-slate-500 min-w-[130px] shrink-0">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-medium">{formatDate(atendimento.data_atendimento)}</span>
                  </div>
                  <button
                    onClick={() => handleOpenDetail(atendimento)}
                    className="flex-1 text-left text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer transition-colors truncate"
                  >
                    {atendimento.solicitacao}
                  </button>
                  {atendimento.documento_url && (
                    <Paperclip
                      className="h-4 w-4 text-indigo-500 shrink-0"
                      aria-label="Possui documento anexo"
                    />
                  )}
                  {atendimento.enviado_implantacao && (
                    <Badge
                      variant="secondary"
                      className="bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Enviado
                    </Badge>
                  )}
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-400 shrink-0" />
                  {!atendimento.enviado_implantacao && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 shrink-0"
                      onClick={() => handleOpenImplantacao(atendimento)}
                    >
                      <Rocket className="h-3.5 w-3.5 mr-1" />
                      Enviar para Implantação
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                    onClick={() => handleDelete(atendimento.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )
            }

            // Atendimento importado (ex: E-mail corporativo)
            return (
              <div
                key={atendimento.id}
                className={`transition-colors ${
                  index !== atendimentos.length - 1 ? 'border-b border-slate-100' : ''
                }`}
              >
                <div className="flex flex-col gap-2 px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 flex items-center gap-1 font-normal">
                      <Mail className="h-3 w-3" />
                      {atendimento.origem === 'E-mail corporativo'
                        ? '✉ E-mail corporativo'
                        : atendimento.origem}
                    </Badge>
                    {atendimento.situacao && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-slate-50 border-slate-200 text-slate-700"
                      >
                        {atendimento.situacao}
                      </Badge>
                    )}
                    {atendimento.fluxo && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-indigo-50 border-indigo-200 text-indigo-700"
                      >
                        <Layers className="h-3 w-3 mr-1 inline" />
                        {atendimento.fluxo}
                      </Badge>
                    )}
                    {atendimento.area_responsavel && (
                      <span className="text-xs text-slate-500 font-medium">
                        Área: {atendimento.area_responsavel}
                      </span>
                    )}
                    {atendimento.responsavel && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <User className="h-3 w-3 text-slate-400" />
                        {atendimento.responsavel}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-col text-xs text-slate-500 min-w-[140px] shrink-0">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {formatDate(atendimento.data_atendimento)}
                      </span>
                      {atendimento.data_ultimo_movimento && (
                        <span className="text-[11px] text-slate-400">
                          Últ. mov: {formatDate(atendimento.data_ultimo_movimento)}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenDetail(atendimento)}
                      className="flex-1 text-left text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer transition-colors truncate"
                    >
                      {atendimento.assunto || atendimento.solicitacao}
                    </button>

                    <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
                      {typeof atendimento.qtd_mensagens_recebidas === 'number' && (
                        <span
                          className="flex items-center gap-0.5 text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded"
                          title="Mensagens recebidas"
                        >
                          <ArrowDownLeft className="h-3 w-3 text-emerald-600" />
                          {atendimento.qtd_mensagens_recebidas}
                        </span>
                      )}
                      {typeof atendimento.qtd_mensagens_enviadas === 'number' && (
                        <span
                          className="flex items-center gap-0.5 text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded"
                          title="Mensagens enviadas"
                        >
                          <ArrowUpRight className="h-3 w-3 text-blue-600" />
                          {atendimento.qtd_mensagens_enviadas}
                        </span>
                      )}
                      {anexosCount > 0 && (
                        <span
                          className="flex items-center gap-0.5 text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-medium"
                          title={`${anexosCount} anexo(s)`}
                        >
                          <Paperclip className="h-3 w-3" />
                          {anexosCount}
                        </span>
                      )}
                    </div>

                    {atendimento.enviado_implantacao && (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Enviado
                      </Badge>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-slate-500 hover:text-slate-800"
                      onClick={(e) => toggleExpand(atendimento.id, e)}
                      title={isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>

                    {!atendimento.enviado_implantacao && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 shrink-0"
                        onClick={() => handleOpenImplantacao(atendimento)}
                      >
                        <Rocket className="h-3.5 w-3.5 mr-1" />
                        Enviar para Implantação
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                      onClick={() => handleDelete(atendimento.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Bloco expandido: UIDs, remetentes/destinatários, observações de revisão */}
                {isExpanded && (
                  <div className="bg-slate-50/80 px-4 py-3 border-t border-slate-100 text-xs space-y-2">
                    {atendimento.resumo && (
                      <div>
                        <span className="font-semibold text-slate-700">Resumo: </span>
                        <span className="text-slate-600">{atendimento.resumo}</span>
                      </div>
                    )}
                    {atendimento.conversa_id && (
                      <div>
                        <span className="font-semibold text-slate-700">Conversa ID: </span>
                        <span className="font-mono text-slate-600">{atendimento.conversa_id}</span>
                      </div>
                    )}
                    {atendimento.remetentes_destinatarios && (
                      <div>
                        <span className="font-semibold text-slate-700">
                          Remetentes / Destinatários:{' '}
                        </span>
                        <pre className="mt-1 p-2 bg-white rounded border border-slate-200 overflow-x-auto text-[11px] text-slate-600 font-mono">
                          {typeof atendimento.remetentes_destinatarios === 'string'
                            ? atendimento.remetentes_destinatarios
                            : JSON.stringify(atendimento.remetentes_destinatarios, null, 2)}
                        </pre>
                      </div>
                    )}
                    {atendimento.uid_emails && (
                      <div>
                        <span className="font-semibold text-slate-700">UIDs dos E-mails: </span>
                        <pre className="mt-1 p-2 bg-white rounded border border-slate-200 overflow-x-auto text-[11px] text-slate-600 font-mono">
                          {typeof atendimento.uid_emails === 'string'
                            ? atendimento.uid_emails
                            : JSON.stringify(atendimento.uid_emails, null, 2)}
                        </pre>
                      </div>
                    )}
                    {atendimento.observacoes_revisao && (
                      <div>
                        <span className="font-semibold text-slate-700">
                          Observações de Revisão:{' '}
                        </span>
                        <span className="text-slate-600">{atendimento.observacoes_revisao}</span>
                      </div>
                    )}
                    {atendimento.importacao_status && (
                      <div>
                        <span className="font-semibold text-slate-700">Status da Importação: </span>
                        <Badge variant="outline" className="text-[11px]">
                          {atendimento.importacao_status}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
