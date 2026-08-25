import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Save, Upload, FileText, X, Building2 } from 'lucide-react'
import { AdvancedDatePicker } from '@/components/ui/advanced-date-picker'
import { formatCNPJ } from '@/lib/formatters'
import {
  createAtendimento,
  uploadAtendimentoDocumento,
  type AtendimentoInput,
} from '@/services/atendimentos'
import {
  SOLICITACAO_OPTIONS,
  getModuleNames,
  formatSolicitacao,
  type SolicitacaoTipo,
} from '@/lib/atendimento-utils'
import {
  buildWhatsAppUrl,
  buildAtendimentoWhatsAppMessage,
  cleansePhoneNumber,
} from '@/lib/whatsapp-utils'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface AtendimentoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clienteId: string
  onSaved: () => void
}

export function AtendimentoFormDialog({
  open,
  onOpenChange,
  clienteId,
  onSaved,
}: AtendimentoFormDialogProps) {
  const [dataAtendimento, setDataAtendimento] = useState('')
  const [tipoSolicitacao, setTipoSolicitacao] = useState<SolicitacaoTipo | ''>('')
  const [moduloSelecionado, setModuloSelecionado] = useState('')
  const [filialNome, setFilialNome] = useState('')
  const [filialCnpj, setFilialCnpj] = useState('')
  const [filialDfeIncluso, setFilialDfeIncluso] = useState(false)
  const [filialValorMensalidade, setFilialValorMensalidade] = useState('')
  const [filialValorDfe, setFilialValorDfe] = useState('')
  const [relatorio, setRelatorio] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setDataAtendimento('')
    setTipoSolicitacao('')
    setModuloSelecionado('')
    setFilialNome('')
    setFilialCnpj('')
    setFilialDfeIncluso(false)
    setFilialValorMensalidade('')
    setFilialValorDfe('')
    setRelatorio('')
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const maxSize = 15 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Máximo permitido: 15MB.')
      e.target.value = ''
      return
    }
    setSelectedFile(file)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const isFilial = tipoSolicitacao === 'Inclusão de Filial'
  const needsModule = tipoSolicitacao === 'Treinamento' || tipoSolicitacao === 'Inclusão de Modulo'

  const handleSubmit = async () => {
    if (!dataAtendimento) {
      toast.error('A data do atendimento é obrigatória')
      return
    }
    if (!tipoSolicitacao) {
      toast.error('O tipo de solicitação é obrigatório')
      return
    }
    if (needsModule && !moduloSelecionado) {
      toast.error('Selecione um módulo para este tipo de solicitação')
      return
    }
    if (isFilial) {
      if (!filialNome.trim()) {
        toast.error('O nome da filial é obrigatório')
        return
      }
      if (!filialCnpj.trim()) {
        toast.error('O CNPJ da filial é obrigatório')
        return
      }
      if (
        filialValorMensalidade === '' ||
        filialValorMensalidade === null ||
        filialValorMensalidade === undefined
      ) {
        toast.error('O valor da mensalidade é obrigatório')
        return
      }
    }
    if (!relatorio.trim()) {
      toast.error('O relatório do atendimento é obrigatório')
      return
    }

    setIsSubmitting(true)
    try {
      let documentoUrl: string | null = null

      if (selectedFile) {
        documentoUrl = await uploadAtendimentoDocumento(clienteId, selectedFile)
      }

      const filialData = isFilial
        ? {
            nome: filialNome.trim(),
            cnpj: filialCnpj.trim(),
            dfe_incluso: filialDfeIncluso,
            valor_mensalidade: filialValorMensalidade,
            valor_dfe: filialDfeIncluso ? filialValorDfe : '',
          }
        : null

      const solicitacaoFormatada = formatSolicitacao(
        tipoSolicitacao as SolicitacaoTipo,
        moduloSelecionado || null,
        filialData,
      )

      const payload: AtendimentoInput = {
        cliente_id: clienteId,
        data_atendimento: new Date(dataAtendimento + 'T12:00:00').toISOString(),
        solicitacao: solicitacaoFormatada,
        relatorio: relatorio.trim(),
        documento_url: documentoUrl,
      }
      await createAtendimento(payload)
      toast.success('Atendimento registrado com sucesso!')

      // Envio de WhatsApp para tipos com valor (Treinamento, Inclusão de Modulo, Inclusão de Filial)
      const shouldSendWhatsApp =
        tipoSolicitacao === 'Treinamento' ||
        tipoSolicitacao === 'Inclusão de Modulo' ||
        tipoSolicitacao === 'Inclusão de Filial'

      if (shouldSendWhatsApp) {
        try {
          const { data: cliente, error: clienteError } = await supabase
            .from('clientes')
            .select('nome, telefone')
            .eq('id', clienteId)
            .single()

          if (clienteError || !cliente) {
            toast.error('Erro ao buscar dados do cliente para WhatsApp')
          } else if (!cliente.telefone || !cleansePhoneNumber(cliente.telefone)) {
            toast.error('Cliente não possui telefone cadastrado para envio de WhatsApp')
          } else if (cleansePhoneNumber(cliente.telefone).length < 10) {
            toast.error('Telefone do cliente inválido para WhatsApp')
          } else {
            const message = buildAtendimentoWhatsAppMessage({
              clienteNome: cliente.nome || '',
              tipoSolicitacao,
              modulo: moduloSelecionado || null,
              filialData,
            })
            const url = buildWhatsAppUrl(cliente.telefone, message)
            if (url) {
              window.open(url, '_blank')
            } else {
              toast.error('Telefone do cliente inválido para WhatsApp')
            }
          }
        } catch {
          toast.error('Erro ao preparar envio do WhatsApp')
        }
      }

      resetForm()
      onOpenChange(false)
      onSaved()
    } catch (error: any) {
      toast.error('Erro ao salvar atendimento: ' + (error.message || ''))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open)
        if (!open) resetForm()
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Atendimento</DialogTitle>
          <DialogDescription>
            Registre os detalhes da interação, reunião ou solicitação do cliente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Data do Atendimento</Label>
            <AdvancedDatePicker
              value={dataAtendimento}
              onChange={setDataAtendimento}
              placeholder="Selecione a data do atendimento"
            />
          </div>
          <div className="space-y-2">
            <Label>Solicitação</Label>
            <Select
              value={tipoSolicitacao}
              onValueChange={(v) => {
                setTipoSolicitacao(v as SolicitacaoTipo)
                if (v !== 'Treinamento' && v !== 'Inclusão de Modulo') {
                  setModuloSelecionado('')
                }
                if (v !== 'Inclusão de Filial') {
                  setFilialNome('')
                  setFilialCnpj('')
                  setFilialDfeIncluso(false)
                  setFilialValorMensalidade('')
                  setFilialValorDfe('')
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de solicitação" />
              </SelectTrigger>
              <SelectContent>
                {SOLICITACAO_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {needsModule && (
            <div className="space-y-2">
              <Label>Módulo</Label>
              <Select value={moduloSelecionado} onValueChange={setModuloSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o módulo" />
                </SelectTrigger>
                <SelectContent>
                  {getModuleNames().map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isFilial && (
            <div className="space-y-3 rounded-lg border border-indigo-100 bg-indigo-50/40 p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-900">
                <Building2 className="h-4 w-4 text-indigo-600" />
                Dados da Filial
              </div>

              <div className="space-y-2">
                <Label htmlFor="filial-nome">
                  Nome da Filial <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="filial-nome"
                  placeholder="Ex: Filial Centro ou Razão Social"
                  value={filialNome}
                  onChange={(e) => setFilialNome(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filial-cnpj">
                  CNPJ da Filial <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="filial-cnpj"
                  placeholder="00.000.000/0000-00"
                  value={filialCnpj}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '')
                    setFilialCnpj(raw.length <= 14 ? formatCNPJ(raw) : e.target.value)
                  }}
                  maxLength={18}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filial-valor-mensalidade">
                  Valor Mensalidade (R$) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="filial-valor-mensalidade"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={filialValorMensalidade}
                  onChange={(e) => setFilialValorMensalidade(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between rounded-md border border-indigo-100 bg-white p-2.5">
                <div className="space-y-0.5">
                  <Label htmlFor="filial-dfe" className="text-sm font-medium cursor-pointer">
                    DF-e Incluso
                  </Label>
                  <p className="text-xs text-slate-500">A filial utilizará emissão DF-e?</p>
                </div>
                <Switch
                  id="filial-dfe"
                  checked={filialDfeIncluso}
                  onCheckedChange={setFilialDfeIncluso}
                />
              </div>

              {filialDfeIncluso && (
                <div className="space-y-2">
                  <Label htmlFor="filial-valor-dfe">Valor DF-e (R$)</Label>
                  <Input
                    id="filial-valor-dfe"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={filialValorDfe}
                    onChange={(e) => setFilialValorDfe(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label>Relatório do Atendimento</Label>
            <Textarea
              placeholder="Descreva detalhadamente tudo que foi discutido, decisões tomadas, próximos passos..."
              value={relatorio}
              onChange={(e) => setRelatorio(e.target.value)}
              className="min-h-[160px]"
            />
          </div>
          <div className="space-y-2">
            <Label>Anexar Documento</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
              id="atendimento-doc-upload"
            />
            {selectedFile ? (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-md p-3">
                <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                <span className="text-sm text-slate-700 font-medium truncate flex-1">
                  {selectedFile.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={handleRemoveFile}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <label
                htmlFor="atendimento-doc-upload"
                className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 hover:text-indigo-600 font-medium transition-colors border-2 border-dashed border-slate-200 rounded-md p-3 hover:border-indigo-200 hover:bg-indigo-50/30"
              >
                <Upload className="h-4 w-4 text-indigo-500" />
                <span>Selecionar arquivo (PDF, DOCX, etc.)</span>
              </label>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Atendimento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
