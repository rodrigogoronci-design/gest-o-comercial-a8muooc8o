import { useState, useRef } from 'react'
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, Save, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { parsePdfContract } from '@/services/parse-pdf'
import { fetchCnpjData } from '@/services/cnpj'
import { createCliente, updateCliente } from '@/services/clientes'
import { createHistorico } from '@/services/historico_contratos'
import { supabase } from '@/lib/supabase/client'
import { Link } from 'react-router-dom'
import { formatCNPJ } from '@/lib/formatters'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface ExtractedData {
  nome: string
  cnpj: string
  nomeFromApi?: boolean
  endereco?: string | null
  repName?: string | null
  repCpf?: string | null
  repRg?: string | null
  valor_total: number
  valor_mensalidade?: number
  valor_implantacao?: number
  modulos: string[]
  planoBase?: string | null
  data_assinatura?: string | null
  detalhes?: {
    valorPlano: number
    numFiliais: number
    valorFiliais: number
    valorModulos: number
  }
}

interface FileStatus {
  file: File
  status: 'pending' | 'extracting' | 'extracted' | 'saving' | 'success' | 'error'
  error?: string
  data?: ExtractedData
}

export function ImportContracts() {
  const { toast } = useToast()
  const [files, setFiles] = useState<FileStatus[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [enrichingIndex, setEnrichingIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((f) => ({
        file: f,
        status: 'pending' as const,
      }))
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files)
        .filter((f) => f.type === 'application/pdf')
        .map((f) => ({ file: f, status: 'pending' as const }))
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleUpdateData = (index: number, field: keyof ExtractedData, value: any) => {
    setFiles((prev) => {
      const newFiles = [...prev]
      if (newFiles[index].data) {
        newFiles[index].data = { ...newFiles[index].data, [field]: value }
      }
      return newFiles
    })
  }

  const handleRefetchCnpj = async (index: number) => {
    const file = files[index]
    if (!file?.data?.cnpj) return
    const rawCnpj = file.data.cnpj.replace(/\D/g, '')
    if (rawCnpj.length !== 14) return

    setEnrichingIndex(index)
    try {
      const { data: cnpjData, error: cnpjError } = await fetchCnpjData(rawCnpj)
      if (cnpjData?.nome) {
        handleUpdateData(index, 'nome', cnpjData.nome)
        handleUpdateData(index, 'nomeFromApi', true)
        if (cnpjData.endereco) handleUpdateData(index, 'endereco', cnpjData.endereco)
        toast({
          title: 'Razão Social atualizada',
          description: 'Dados oficiais obtidos via Receita Federal.',
        })
      } else if (cnpjError) {
        toast({
          title: 'Falha na consulta',
          description: cnpjError,
          variant: 'destructive',
        })
      }
    } catch {
      // Keep existing data
    } finally {
      setEnrichingIndex(null)
    }
  }

  const extractData = async () => {
    setIsProcessing(true)

    let allExtracted = true
    const updatedFiles = [...files]
    let enrichedCount = 0

    for (let i = 0; i < updatedFiles.length; i++) {
      if (updatedFiles[i].status !== 'pending' && updatedFiles[i].status !== 'error') continue

      updatedFiles[i].status = 'extracting'
      setFiles([...updatedFiles])

      try {
        const extractedData = await parsePdfContract(updatedFiles[i].file)

        const rawCnpj = extractedData.cnpj?.replace(/\D/g, '')
        if (rawCnpj && rawCnpj.length === 14) {
          try {
            const { data: cnpjData } = await fetchCnpjData(rawCnpj)
            if (cnpjData?.nome) {
              extractedData.nome = cnpjData.nome
              extractedData.nomeFromApi = true
              enrichedCount++
            }
          } catch {
            // CNPJ lookup failed — keep extracted name, allow manual edit
          }
        }

        updatedFiles[i] = { ...updatedFiles[i], status: 'extracted', data: extractedData }
      } catch (err: any) {
        updatedFiles[i] = { ...updatedFiles[i], status: 'error', error: err.message }
        allExtracted = false
      }
      setFiles([...updatedFiles])
    }

    setIsProcessing(false)
    if (enrichedCount > 0) {
      toast({
        title: 'Razão Social enriquecida',
        description: `${enrichedCount} empresa(s) tiveram o nome oficial obtido via Receita Federal.`,
      })
    }
    if (allExtracted && updatedFiles.some((f) => f.status === 'extracted')) {
      setShowPreview(true)
    } else if (updatedFiles.some((f) => f.status === 'extracted')) {
      toast({
        title: 'Extração concluída com erros',
        description:
          'Alguns arquivos não puderam ser processados. Você pode revisar os que deram certo.',
        variant: 'destructive',
      })
      setShowPreview(true)
    } else {
      toast({
        title: 'Erro na extração',
        description:
          'Não foi possível ler os dados do contrato. Por favor, verifique se o arquivo segue o modelo padrão.',
        variant: 'destructive',
      })
    }
  }

  const saveContracts = async () => {
    setIsProcessing(true)
    setShowPreview(false)

    const updatedFiles = [...files]

    for (let i = 0; i < updatedFiles.length; i++) {
      if (updatedFiles[i].status !== 'extracted' || !updatedFiles[i].data) continue

      updatedFiles[i].status = 'saving'
      setFiles([...updatedFiles])

      try {
        const data = updatedFiles[i].data!

        const safeName = updatedFiles[i].file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const storagePath = `${Date.now()}-${safeName}`
        let contratoUrl = ''

        const { error: uploadError } = await supabase.storage
          .from('contracts')
          .upload(storagePath, updatedFiles[i].file, { upsert: true })

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('contracts')
            .getPublicUrl(storagePath)
          contratoUrl = publicUrlData.publicUrl
        }

        let planoId = null
        if (data.planoBase) {
          const { data: planoData } = await supabase
            .from('planos_saude')
            .select('id')
            .eq('codigo', data.planoBase.toLowerCase())
            .maybeSingle()
          if (planoData) planoId = planoData.id
        }

        const clientPayload = {
          nome: data.nome,
          cnpj: data.cnpj,
          contrato_url: contratoUrl || null,
          valor_total: data.valor_total,
          valor_mensalidade: data.valor_mensalidade || data.valor_total,
          valor_implantacao: data.valor_implantacao || 0,
          data_assinatura: data.data_assinatura || null,
          plano_id: planoId,
          rep_nome: data.repName || null,
          rep_cpf: data.repCpf || null,
          rep_rg: data.repRg || null,
          endereco: data.endereco || null,
          status: 'Ativo',
          modulos: {
            plano_base: data.planoBase,
            filiais: data.detalhes?.numFiliais || 0,
            adicionais: data.modulos || [],
          },
        }

        const rawCnpj = data.cnpj.replace(/\D/g, '')
        const { data: existingClient } = await supabase
          .from('clientes')
          .select('id')
          .eq('cnpj', rawCnpj)
          .maybeSingle()

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
          data_solicitacao: data.data_assinatura || new Date().toISOString().split('T')[0],
          plano: data.planoBase || '',
          modulos: data.modulos || [],
          valor_total: data.valor_total,
          observacoes: 'Contrato importado via upload de PDF assinado.',
          status: 'Assinado',
        })

        updatedFiles[i].status = 'success'
      } catch (err: any) {
        updatedFiles[i] = { ...updatedFiles[i], status: 'error', error: err.message }
      }
      setFiles([...updatedFiles])
    }

    setIsProcessing(false)

    const successCount = updatedFiles.filter((f) => f.status === 'success').length
    if (successCount > 0) {
      toast({
        title: 'Importação concluída',
        description: `${successCount} contrato(s) salvo(s) com sucesso. PDFs armazenados e histórico criado.`,
      })
    } else {
      toast({
        title: 'Falha na importação',
        description: 'Não foi possível salvar os contratos. Verifique os erros acima.',
        variant: 'destructive',
      })
    }
  }

  const formatCurrencyLocal = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const pendingCount = files.filter((f) => f.status === 'pending' || f.status === 'error').length
  const extractedFiles = files.filter((f) => f.status === 'extracted')
  const progress = files.length
    ? (files.filter((f) => f.status === 'success' || f.status === 'error').length / files.length) *
      100
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importar Contratos em Lote</CardTitle>
        <CardDescription>
          Upload Contrato Assinado — Faça o upload de PDFs de contratos assinados. O sistema irá
          extrair automaticamente o Plano base, Módulos contratados, Valores e Datas. Você poderá
          validar os dados antes de inserir na base de clientes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className="border-2 border-dashed border-slate-200 rounded-lg p-10 text-center hover:bg-slate-50 transition-colors cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-10 w-10 text-slate-400 mb-4" />
          <p className="text-sm font-medium text-slate-700">
            Upload Contrato Assinado — Clique ou arraste os PDFs aqui
          </p>
          <p className="text-xs text-slate-500 mt-1">Apenas arquivos .pdf</p>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            accept=".pdf"
            onChange={handleFileSelect}
          />
        </div>

        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
              <span className="font-medium text-slate-600">
                {files.length} arquivos selecionados
              </span>
              <div className="flex gap-2">
                {files.some((f) => f.status === 'extracted') && (
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(true)}
                    disabled={isProcessing}
                  >
                    Revisar Extração
                  </Button>
                )}
                <Button onClick={extractData} disabled={isProcessing || pendingCount === 0}>
                  {isProcessing && files.some((f) => f.status === 'extracting') ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Extraindo Dados...
                    </>
                  ) : (
                    'Processar PDFs'
                  )}
                </Button>
              </div>
            </div>

            {isProcessing && <Progress value={progress > 0 ? progress : 100} className="h-2" />}

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-md border text-sm"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                    <span className="truncate max-w-[200px] font-medium">{f.file.name}</span>
                    {f.status === 'success' && (
                      <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded font-medium">
                        Salvo
                      </span>
                    )}
                  </div>
                  <div>
                    {f.status === 'pending' && <span className="text-slate-400">Pendente</span>}
                    {(f.status === 'extracting' || f.status === 'saving') && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                    {f.status === 'extracted' && (
                      <span className="text-blue-500 font-medium">Pronto para salvar</span>
                    )}
                    {f.status === 'success' && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                    {f.status === 'error' && (
                      <AlertCircle className="h-4 w-4 text-red-500" title={f.error} />
                    )}
                  </div>
                </div>
              ))}
            </div>
            {files.some((f) => f.status === 'success') && !isProcessing && (
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" asChild>
                  <Link to="/clientes">Ver Clientes & Iniciar Implantação</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 bg-slate-50">
          <DialogHeader className="px-6 py-4 border-b bg-white">
            <DialogTitle className="text-xl flex items-center gap-2 text-slate-800">
              <FileText className="w-5 h-5 text-indigo-600" />
              Revisão dos Dados Extraídos
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1">
              Valide as informações extraídas do PDF antes de confirmar.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-8 pb-4">
              {extractedFiles.length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  Nenhum dado extraído com sucesso ainda.
                </p>
              ) : (
                files.map((f, index) => {
                  if (f.status !== 'extracted' || !f.data) return null

                  // Format the date to input type date
                  let dateValue = ''
                  if (f.data.data_assinatura) {
                    const parts = f.data.data_assinatura.split('-')
                    if (parts.length === 3) dateValue = f.data.data_assinatura
                  }

                  return (
                    <div
                      key={index}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Razão Social
                            </Label>
                            {enrichingIndex === index ? (
                              <span className="text-[10px] font-medium text-indigo-600 flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Buscando dados oficiais...
                              </span>
                            ) : f.data.nomeFromApi ? (
                              <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                Via Receita Federal
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRefetchCnpj(index)}
                                className="text-[10px] font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                              >
                                <RefreshCw className="w-3 h-3" />
                                Buscar oficial
                              </button>
                            )}
                          </div>
                          <Input
                            value={f.data.nome}
                            onChange={(e) => handleUpdateData(index, 'nome', e.target.value)}
                            disabled={enrichingIndex === index}
                            placeholder={
                              enrichingIndex === index
                                ? 'Buscando dados oficiais...'
                                : 'Razão Social'
                            }
                            className="font-medium h-12 bg-slate-50/50"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            CNPJ
                          </Label>
                          <Input
                            value={f.data.cnpj}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, '')
                              const formatted = raw.length <= 14 ? formatCNPJ(raw) : e.target.value
                              handleUpdateData(index, 'cnpj', formatted)
                            }}
                            className="font-medium h-12 bg-slate-50/50"
                            placeholder="00.000.000/0000-00"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-indigo-50/80 border border-indigo-100 rounded-lg p-4">
                          <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide mb-1">
                            Plano TMS
                          </div>
                          <div className="font-bold text-indigo-700 text-lg">
                            {f.data.planoBase || 'Nenhum'}
                          </div>
                        </div>
                        <div className="bg-emerald-50/80 border border-emerald-100 rounded-lg p-4">
                          <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1">
                            Mensalidade
                          </div>
                          <div className="font-bold text-emerald-700 text-lg">
                            {formatCurrencyLocal(
                              f.data.valor_mensalidade || f.data.valor_total || 0,
                            )}
                          </div>
                        </div>
                        <div className="bg-amber-50/80 border border-amber-100 rounded-lg p-4">
                          <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1">
                            Implantação
                          </div>
                          <div className="font-bold text-amber-700 text-lg">
                            {formatCurrencyLocal(f.data.valor_implantacao || 0)}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Data de Assinatura
                          </Label>
                          <Input
                            type="date"
                            value={dateValue}
                            onChange={(e) =>
                              handleUpdateData(index, 'data_assinatura', e.target.value)
                            }
                            className="font-medium h-12 w-full md:w-auto bg-slate-50/50"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-slate-700">
                          Módulos Inclusos ({f.data.modulos.length})
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {f.data.modulos.map((mod, idx) => (
                            <span
                              key={idx}
                              className="bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-full text-xs font-medium shadow-sm"
                            >
                              {mod}
                            </span>
                          ))}
                          {f.data.modulos.length === 0 && (
                            <span className="text-sm text-slate-400 italic">
                              Nenhum módulo adicional.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="p-4 border-t bg-white flex flex-row items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setShowPreview(false)} className="px-6">
              Cancelar
            </Button>
            <Button
              onClick={saveContracts}
              disabled={extractedFiles.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
            >
              <Save className="w-4 h-4 mr-2" />
              Confirmar e Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
