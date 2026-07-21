import { useState, useEffect, useCallback, useRef } from 'react'
import {
  FileText,
  Trash2,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  getArquivos,
  uploadArquivo,
  deleteArquivo,
  getArquivoSignedUrl,
  type ImplementacaoArquivo,
} from '@/services/implementacao-arquivos'
import { DocumentChecklist } from '@/components/DocumentChecklist'

interface UploadItem {
  fileName: string
  progress: number
  error: string | null
  done: boolean
}

export function ImplementationDocumentRepository({
  implementacaoId,
  dadosParametrizacao,
}: {
  implementacaoId: string
  dadosParametrizacao: Record<string, any>
}) {
  const [arquivos, setArquivos] = useState<ImplementacaoArquivo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [dados, setDados] = useState<Record<string, any>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDados(dadosParametrizacao || {})
  }, [dadosParametrizacao])

  const loadArquivos = useCallback(async () => {
    setLoading(true)
    try {
      setArquivos(await getArquivos(implementacaoId))
    } catch (e: any) {
      toast.error('Erro ao carregar arquivos: ' + (e.message || ''))
    } finally {
      setLoading(false)
    }
  }, [implementacaoId])

  useEffect(() => {
    loadArquivos()
  }, [loadArquivos])

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files)
    if (!arr.length) return
    setUploads(arr.map((f) => ({ fileName: f.name, progress: 0, error: null, done: false })))
    for (let i = 0; i < arr.length; i++) {
      setUploads((prev) => prev.map((p, idx) => (idx === i ? { ...p, progress: 50 } : p)))
      try {
        await uploadArquivo(implementacaoId, arr[i])
        setUploads((prev) =>
          prev.map((p, idx) => (idx === i ? { ...p, progress: 100, done: true } : p)),
        )
      } catch (e: any) {
        setUploads((prev) =>
          prev.map((p, idx) => (idx === i ? { ...p, error: e.message || 'Falha', done: true } : p)),
        )
      }
    }
    await loadArquivos()
    setTimeout(() => setUploads([]), 2500)
  }

  const handleDelete = async (a: ImplementacaoArquivo) => {
    if (!confirm(`Remover "${a.file_name}"?`)) return
    try {
      await deleteArquivo(a.id, a.file_path)
      setArquivos((p) => p.filter((x) => x.id !== a.id))
      toast.success('Arquivo removido!')
    } catch (e: any) {
      toast.error('Erro ao remover: ' + (e.message || ''))
    }
  }

  const handleDownload = async (a: ImplementacaoArquivo) => {
    const url = await getArquivoSignedUrl(a.file_path)
    if (url) window.open(url, '_blank')
    else toast.error('Não foi possível obter o link do arquivo')
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
        Arquivos do Projeto
      </h3>
      <DocumentChecklist implementacaoId={implementacaoId} dados={dados} onDadosChange={setDados} />
      <Card>
        <CardContent className="p-4 space-y-4">
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
              dragOver
                ? 'border-indigo-400 bg-indigo-50'
                : 'border-slate-300 bg-slate-50/50 hover:border-indigo-300 hover:bg-indigo-50/30',
            )}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files)
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
            <FolderOpen className="h-10 w-10 text-indigo-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Múltiplos arquivos suportados • Máximo 15MB por arquivo
            </p>
          </div>

          {uploads.length > 0 && (
            <div className="space-y-2">
              {uploads.map((u, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 truncate">
                      {u.error ? (
                        <AlertCircle className="h-3 w-3 text-red-500 shrink-0" />
                      ) : u.done ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                      ) : (
                        <Loader2 className="h-3 w-3 text-indigo-500 animate-spin shrink-0" />
                      )}
                      <span className="truncate">{u.fileName}</span>
                    </span>
                    {u.error && <span className="text-red-500 text-[10px]">{u.error}</span>}
                  </div>
                  {!u.error && <Progress value={u.progress} className="h-1.5" />}
                </div>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
            </div>
          ) : arquivos.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              Nenhum arquivo enviado ainda.
            </div>
          ) : (
            <div className="space-y-1.5">
              {arquivos.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 p-2.5 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{a.file_name}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(a.created_at).toLocaleDateString('pt-BR')}
                      {a.file_size ? ` • ${(a.file_size / 1024).toFixed(0)} KB` : ''}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                    onClick={() => handleDownload(a)}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500 hover:bg-red-50"
                    onClick={() => handleDelete(a)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
