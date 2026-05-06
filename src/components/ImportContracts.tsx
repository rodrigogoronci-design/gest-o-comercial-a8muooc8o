import { useState, useRef } from 'react'
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { parsePdfContract } from '@/services/parse-pdf'
import { createCliente } from '@/services/clientes'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ExtractedData {
  nome: string
  cnpj: string
  contrato_url: string
  valor_total: number
  modulos: string[]
  planoBase?: string
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

  const extractData = async () => {
    setIsProcessing(true)

    let allExtracted = true
    const updatedFiles = [...files]

    for (let i = 0; i < updatedFiles.length; i++) {
      if (updatedFiles[i].status !== 'pending' && updatedFiles[i].status !== 'error') continue

      updatedFiles[i].status = 'extracting'
      setFiles([...updatedFiles])

      try {
        const extractedData = await parsePdfContract(updatedFiles[i].file)
        updatedFiles[i] = { ...updatedFiles[i], status: 'extracted', data: extractedData }
      } catch (err: any) {
        updatedFiles[i] = { ...updatedFiles[i], status: 'error', error: err.message }
        allExtracted = false
      }
      setFiles([...updatedFiles])
    }

    setIsProcessing(false)
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
        description: 'Não foi possível extrair dados dos PDFs.',
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
        await createCliente({
          nome: updatedFiles[i].data!.nome,
          cnpj: updatedFiles[i].data!.cnpj,
          contrato_url: updatedFiles[i].data!.contrato_url,
          valor_total: updatedFiles[i].data!.valor_total,
          status: 'Ativo',
          modulos: {
            plano_base: updatedFiles[i].data!.planoBase,
            filiais: updatedFiles[i].data!.detalhes?.numFiliais || 0,
            adicionais: updatedFiles[i].data!.modulos || [],
          },
        })
        updatedFiles[i].status = 'success'
      } catch (err: any) {
        updatedFiles[i] = { ...updatedFiles[i], status: 'error', error: err.message }
      }
      setFiles([...updatedFiles])
    }

    setIsProcessing(false)
    toast({
      title: 'Importação concluída',
      description: 'Os contratos foram salvos na base de clientes.',
    })
  }

  const formatCurrency = (val: number) =>
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
          Faça o upload de arquivos PDF. O sistema irá extrair automaticamente o Plano base, Filiais
          adicionais, Módulos contratados e Valores. Você poderá validar os dados antes de inserir
          na base de clientes.
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
            Clique para selecionar ou arraste os PDFs aqui
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
          </div>
        )}
      </CardContent>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Resumo da Extração de Contratos</DialogTitle>
            <DialogDescription>
              Valide as informações extraídas dos PDFs. O sistema identificou o plano base, filiais
              adicionais e os módulos contratados.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6 pb-4">
              {extractedFiles.length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  Nenhum dado extraído com sucesso ainda.
                </p>
              ) : (
                extractedFiles.map((f, i) => (
                  <Card key={i} className="border-blue-100 bg-slate-50/50 shadow-none">
                    <CardHeader className="py-3 px-4 bg-white border-b border-blue-50">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          {f.data?.nome}{' '}
                          <span className="text-sm font-normal text-slate-500">
                            ({f.data?.cnpj})
                          </span>
                        </CardTitle>
                        <div className="text-lg font-bold text-indigo-700">
                          {formatCurrency(f.data?.valor_total || 0)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div className="space-y-3">
                        <div>
                          <p className="text-slate-500 mb-2 font-medium">Composição do Valor</p>
                          <ul className="space-y-2">
                            <li className="flex justify-between items-center bg-white p-2 rounded border border-slate-100">
                              <span>
                                Plano Base{' '}
                                <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-1 rounded ml-1">
                                  {f.data?.planoBase || 'Não identificado'}
                                </span>
                              </span>
                              <span className="font-medium">
                                {formatCurrency(f.data?.detalhes?.valorPlano || 0)}
                              </span>
                            </li>
                            <li className="flex justify-between items-center bg-white p-2 rounded border border-slate-100">
                              <span>
                                Filiais Adicionais{' '}
                                <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-1 rounded ml-1">
                                  {f.data?.detalhes?.numFiliais || 0}
                                </span>
                              </span>
                              <span className="font-medium">
                                {formatCurrency(f.data?.detalhes?.valorFiliais || 0)}
                              </span>
                            </li>
                            <li className="flex justify-between items-center bg-white p-2 rounded border border-slate-100">
                              <span>Módulos Adicionais</span>
                              <span className="font-medium">
                                {formatCurrency(f.data?.detalhes?.valorModulos || 0)}
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-2 font-medium">
                          Módulos Identificados ({f.data?.modulos.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {f.data?.modulos.map((mod, idx) => (
                            <span
                              key={idx}
                              className="bg-white border border-slate-200 text-slate-700 px-2 py-1 rounded-md text-xs shadow-sm"
                            >
                              {mod}
                            </span>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="p-4 border-t bg-slate-50/80">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Revisar Depois
            </Button>
            <Button onClick={saveContracts} disabled={extractedFiles.length === 0}>
              <Save className="w-4 h-4 mr-2" />
              Confirmar e Salvar {extractedFiles.length} clientes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
