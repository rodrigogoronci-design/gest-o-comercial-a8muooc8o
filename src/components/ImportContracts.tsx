import { useState, useRef } from 'react'
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { parsePdfContract } from '@/services/parse-pdf'
import { createCliente } from '@/services/clientes'

interface FileStatus {
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  data?: any
}

export function ImportContracts() {
  const { toast } = useToast()
  const [files, setFiles] = useState<FileStatus[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
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

  const processFiles = async () => {
    setIsProcessing(true)

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== 'pending') continue

      setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: 'uploading' } : f)))

      try {
        const extractedData = await parsePdfContract(files[i].file)

        await createCliente({
          nome: extractedData.nome,
          cnpj: extractedData.cnpj,
          contrato_url: extractedData.contrato_url,
          valor_total: extractedData.valor_total,
          status: 'Ativo',
          modulos: extractedData.modulos || [],
        })

        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: 'success', data: extractedData } : f)),
        )
      } catch (err: any) {
        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: 'error', error: err.message } : f)),
        )
      }
    }

    setIsProcessing(false)
    toast({ title: 'Processamento concluído', description: 'Todos os arquivos foram processados.' })
  }

  const pendingCount = files.filter((f) => f.status === 'pending').length
  const successCount = files.filter((f) => f.status === 'success').length
  const errorCount = files.filter((f) => f.status === 'error').length
  const progress = files.length ? ((successCount + errorCount) / files.length) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importar Contratos em Lote</CardTitle>
        <CardDescription>
          Faça o upload de arquivos PDF. O sistema irá extrair automaticamente o Nome, CNPJ, Plano e
          Valores, e inserir na base de clientes.
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
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{files.length} arquivos selecionados</span>
              <Button onClick={processFiles} disabled={isProcessing || pendingCount === 0}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...
                  </>
                ) : (
                  'Processar Arquivos'
                )}
              </Button>
            </div>

            {isProcessing && <Progress value={progress} className="h-2" />}

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-md border text-sm"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                    <span className="truncate max-w-[200px] font-medium">{f.file.name}</span>
                    {f.data && (
                      <span className="text-xs text-slate-500 flex items-center gap-1 truncate">
                        <span>
                          - {f.data.nome} ({f.data.cnpj})
                        </span>
                        <span className="font-medium px-1 text-emerald-600 bg-emerald-50 rounded">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(f.data.valor_total || 0)}
                        </span>
                        <span className="text-slate-400 truncate max-w-[150px]">
                          [{f.data.modulos?.join(', ')}]
                        </span>
                      </span>
                    )}
                  </div>
                  <div>
                    {f.status === 'pending' && <span className="text-slate-400">Pendente</span>}
                    {f.status === 'uploading' && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
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
    </Card>
  )
}
