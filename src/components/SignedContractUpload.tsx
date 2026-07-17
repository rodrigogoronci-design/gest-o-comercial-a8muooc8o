import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, Save, Rocket, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { parsePdfContract, ExtractedContractData } from '@/services/parse-pdf'
import { createCliente, updateCliente } from '@/services/clientes'
import { createHistorico } from '@/services/historico_contratos'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

function formatDateBR(dateStr: string | null | undefined) {
  if (!dateStr) return 'Não identificada'
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('pt-BR')
  } catch {
    return dateStr
  }
}

export function SignedContractUpload() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedContractData | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [savedClientId, setSavedClientId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleError = (message: string) => {
    toast({
      title: 'Erro na extração',
      description: message,
      variant: 'destructive',
    })
  }

  const processFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      handleError('Apenas arquivos PDF são aceitos.')
      return
    }

    setIsProcessing(true)
    setExtractedData(null)
    setUploadedFile(file)
    setSavedClientId(null)

    try {
      const data = await parsePdfContract(file)

      if (!data.cnpj && !data.nome) {
        handleError('Modelo de contrato não reconhecido. Por favor, verifique o arquivo.')
        setIsProcessing(false)
        return
      }

      if (data.valor_total === 0 && data.modulos.length === 0 && !data.planoBase) {
        handleError('Modelo de contrato não reconhecido. Por favor, verifique o arquivo.')
        setIsProcessing(false)
        return
      }

      setExtractedData(data)
      setShowPreview(true)
    } catch (err: any) {
      const msg =
        err.message?.includes('não foi possível') || err.message?.includes('modelo padrão')
          ? 'Modelo de contrato não reconhecido. Por favor, verifique o arquivo.'
          : err.message || 'Erro ao processar o arquivo PDF.'
      handleError(msg)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleConfirmSave = async () => {
    if (!extractedData || !uploadedFile) return

    setIsSaving(true)
    try {
      const safeName = uploadedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const storagePath = `${Date.now()}-${safeName}`
      let contratoUrl = ''

      const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(storagePath, uploadedFile, { upsert: true })

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('contracts').getPublicUrl(storagePath)
        contratoUrl = publicUrlData.publicUrl
      }

      const rawCnpj = (extractedData.cnpj || '').replace(/\D/g, '')

      const { data: existingClient } = await supabase
        .from('clientes')
        .select('id, nome, valor_total')
        .or(`cnpj.eq.${rawCnpj},cnpj.eq.${extractedData.cnpj}`)
        .maybeSingle()

      let planoId = null
      if (extractedData.planoBase) {
        const { data: planoData } = await supabase
          .from('planos_saude')
          .select('id')
          .eq('codigo', extractedData.planoBase.toLowerCase())
          .maybeSingle()
        if (planoData) planoId = planoData.id
      }

      const clientPayload = {
        nome: extractedData.nome,
        cnpj: extractedData.cnpj,
        contrato_url: contratoUrl || null,
        valor_total: extractedData.valor_total,
        valor_mensalidade: extractedData.valor_mensalidade || extractedData.valor_total,
        valor_implantacao: extractedData.valor_implantacao || 0,
        data_assinatura: extractedData.data_assinatura || null,
        plano_id: planoId,
        rep_nome: extractedData.repName || null,
        rep_cpf: extractedData.repCpf || null,
        rep_rg: extractedData.repRg || null,
        endereco: extractedData.endereco || null,
        status: 'Ativo',
        modulos: {
          plano_base: extractedData.planoBase,
          filiais: extractedData.detalhes?.numFiliais || 0,
          adicionais: extractedData.modulos || [],
        },
      }

      let clientId: string

      if (existingClient) {
        const updated = await updateCliente(existingClient.id, clientPayload)
        clientId = updated.id
      } else {
        const created = await createCliente(clientPayload)
        clientId = created.id
      }

      await createHistorico({
        cliente_id: clientId,
        tipo: 'Contrato Inicial',
        data_solicitacao: extractedData.data_assinatura || new Date().toISOString().split('T')[0],
        plano: extractedData.planoBase || '',
        modulos: extractedData.modulos || [],
        valor_total: extractedData.valor_total,
        observacoes: 'Contrato importado via upload de PDF assinado.',
        status: 'Assinado',
      })

      setSavedClientId(clientId)

      toast({
        title: 'Contrato salvo com sucesso!',
        description: 'O cliente foi atualizado e o PDF armazenado.',
        className: 'bg-emerald-600 text-white border-none',
      })
    } catch (err: any) {
      handleError(err.message || 'Erro ao salvar o contrato.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClosePreview = () => {
    setShowPreview(false)
    setExtractedData(null)
    setUploadedFile(null)
    setSavedClientId(null)
  }

  const handleGoToClient = () => {
    if (savedClientId) {
      navigate('/clientes')
    }
  }

  const handleStartImplementation = () => {
    if (savedClientId) {
      navigate(`/implementacoes?cliente=${savedClientId}`)
    }
  }

  return (
    <>
      <Card className="border-emerald-100 shadow-sm bg-emerald-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-emerald-800 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" /> Upload de Contrato Assinado
          </CardTitle>
          <CardDescription className="text-xs text-emerald-700/80">
            Envie um PDF de contrato assinado. O sistema extrai automaticamente plano, módulos,
            valores e data de assinatura.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              setIsDragging(false)
            }}
            onDrop={handleDrop}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={cn(
              'relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer',
              isDragging
                ? 'border-emerald-500 bg-emerald-100/50'
                : 'border-emerald-200 hover:border-emerald-300 bg-white',
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileSelect}
            />
            {isProcessing ? (
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                <span className="text-sm font-medium text-emerald-700">
                  Processando contrato...
                </span>
              </div>
            ) : (
              <>
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-slate-700">
                  Clique ou arraste um PDF de contrato assinado
                </span>
                <span className="text-xs text-slate-500 mt-1">Apenas arquivos .pdf</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPreview} onOpenChange={(open) => !open && handleClosePreview()}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              {savedClientId ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Contrato Salvo com Sucesso
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Revisão dos Dados Extraídos
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {savedClientId
                ? 'O contrato foi processado e salvo. Escolha o próximo passo.'
                : 'Valide as informações extraídas do PDF antes de confirmar.'}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 p-6">
            {extractedData && !savedClientId && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-xs text-slate-500 font-medium uppercase mb-1">
                      Razão Social
                    </p>
                    <p className="text-sm font-bold text-slate-800">{extractedData.nome}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-xs text-slate-500 font-medium uppercase mb-1">CNPJ</p>
                    <p className="text-sm font-bold text-slate-800">{extractedData.cnpj}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                    <p className="text-xs text-indigo-600 font-medium uppercase mb-1">Plano TMS</p>
                    <p className="text-sm font-bold text-indigo-800">
                      {extractedData.planoBase || 'Não identificado'}
                    </p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                    <p className="text-xs text-emerald-600 font-medium uppercase mb-1">
                      Mensalidade
                    </p>
                    <p className="text-sm font-bold text-emerald-800">
                      {formatCurrency(extractedData.valor_mensalidade || extractedData.valor_total)}
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <p className="text-xs text-amber-600 font-medium uppercase mb-1">Implantação</p>
                    <p className="text-sm font-bold text-amber-800">
                      {formatCurrency(extractedData.valor_implantacao || 0)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-xs text-slate-500 font-medium uppercase mb-1">
                      Data de Assinatura
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      {formatDateBR(extractedData.data_assinatura)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">
                    Módulos Inclusos ({extractedData.modulos.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {extractedData.modulos.length > 0 ? (
                      extractedData.modulos.map((mod, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="bg-white border border-slate-200 text-slate-700"
                        >
                          {mod}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">Nenhum módulo identificado</span>
                    )}
                  </div>
                </div>

                {extractedData.endereco && (
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-xs text-slate-500 font-medium uppercase mb-1">Endereço</p>
                    <p className="text-sm text-slate-700">{extractedData.endereco}</p>
                  </div>
                )}

                {(extractedData.repName || extractedData.repCpf) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {extractedData.repName && (
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <p className="text-xs text-slate-500 font-medium uppercase mb-1">
                          Representante Legal
                        </p>
                        <p className="text-sm font-medium text-slate-700">
                          {extractedData.repName}
                        </p>
                      </div>
                    )}
                    {extractedData.repCpf && (
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <p className="text-xs text-slate-500 font-medium uppercase mb-1">
                          CPF do Representante
                        </p>
                        <p className="text-sm font-medium text-slate-700">{extractedData.repCpf}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700">
                    Ao confirmar, o sistema irá salvar o PDF no armazenamento, criar ou atualizar o
                    registro do cliente e registrar o contrato no histórico.
                  </p>
                </div>
              </div>
            )}

            {savedClientId && (
              <div className="space-y-5 text-center py-6">
                <div className="flex justify-center">
                  <div className="p-4 bg-emerald-50 rounded-full">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                  </div>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-800">Contrato processado e salvo!</p>
                  <p className="text-sm text-slate-500 mt-1">
                    O cliente foi criado/atualizado e o PDF foi vinculado. O que deseja fazer agora?
                  </p>
                </div>
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="p-4 border-t bg-slate-50/80 shrink-0">
            {savedClientId ? (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:justify-end">
                <Button variant="outline" onClick={handleClosePreview}>
                  <X className="w-4 h-4 mr-2" /> Fechar
                </Button>
                <Button variant="outline" onClick={handleGoToClient}>
                  <FileText className="w-4 h-4 mr-2" /> Ver Cliente
                </Button>
                <Button
                  onClick={handleStartImplementation}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Rocket className="w-4 h-4 mr-2" /> Iniciar Implantação
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:justify-end">
                <Button variant="outline" onClick={handleClosePreview} disabled={isSaving}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmSave}
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isSaving ? 'Salvando...' : 'Confirmar e Salvar'}
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
