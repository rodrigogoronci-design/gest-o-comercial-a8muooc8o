import { useState, useRef } from 'react'
import {
  Upload,
  FileText,
  Eye,
  Trash2,
  Loader2,
  CheckCircle2,
  Download,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getSignedContractUrl } from '@/lib/storage'

interface ClientContractUploadProps {
  clientId: string
  clientName: string
  currentUrl: string | null
  onUrlChange: (url: string | null) => void
}

export function ClientContractUpload({
  clientId,
  clientName,
  currentUrl,
  onUrlChange,
}: ClientContractUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [loadingAction, setLoadingAction] = useState(false)
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleView = async () => {
    if (!currentUrl) return
    setLoadingAction(true)
    setPdfError(null)
    try {
      const { url, error } = await getSignedContractUrl(currentUrl)
      if (error || !url) {
        setPdfError(error || 'Documento não encontrado')
      } else {
        setPdfViewerUrl(url)
      }
    } catch {
      setPdfError('Erro ao carregar documento')
    } finally {
      setLoadingAction(false)
    }
  }

  const handleOpenExternal = async () => {
    if (!currentUrl) return
    setLoadingAction(true)
    try {
      const { url, error } = await getSignedContractUrl(currentUrl)
      if (error || !url) {
        toast.error(error || 'Documento não encontrado')
      } else {
        window.open(url, '_blank')
      }
    } catch {
      toast.error('Erro ao abrir contrato')
    } finally {
      setLoadingAction(false)
    }
  }

  const handleDownload = async () => {
    if (!currentUrl) return
    setLoadingAction(true)
    try {
      const { url, error } = await getSignedContractUrl(currentUrl)
      if (error || !url) {
        toast.error(error || 'Documento não encontrado')
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = `Contrato-${clientName}.pdf`
        a.target = '_blank'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    } catch {
      toast.error('Erro ao baixar documento')
    } finally {
      setLoadingAction(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSize = 15 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Máximo permitido: 15MB.')
      return
    }

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      toast.error('Formato inválido. Use PDF, JPG ou PNG.')
      return
    }

    setUploading(true)
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `${clientId}/${Date.now()}-${safeName}`

      const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage.from('contracts').getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('clientes')
        .update({ contrato_url: publicUrlData.publicUrl })
        .eq('id', clientId)

      if (updateError) throw updateError

      onUrlChange(publicUrlData.publicUrl)
      toast.success('Contrato enviado e vinculado com sucesso!')
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error('Erro ao enviar contrato: ' + (error.message || 'Falha desconhecida'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async () => {
    if (!currentUrl) return
    if (!confirm('Deseja realmente remover o contrato anexado?')) return

    try {
      const { error: updateError } = await supabase
        .from('clientes')
        .update({ contrato_url: null })
        .eq('id', clientId)

      if (updateError) throw updateError

      onUrlChange(null)
      toast.success('Contrato removido do cliente.')
    } catch (error: any) {
      toast.error('Erro ao remover contrato: ' + (error.message || ''))
    }
  }

  return (
    <>
      <div className="border-2 border-dashed rounded-lg p-5 transition-colors mb-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleUpload}
          className="hidden"
          id="contract-upload-input"
        />

        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-800">Contrato Assinado</h3>
          {currentUrl && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium ml-auto">
              <CheckCircle2 className="h-3.5 w-3.5" /> Anexado
            </span>
          )}
        </div>

        {currentUrl ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-emerald-50/50 border border-emerald-100 rounded-md p-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="p-2 bg-indigo-50 rounded text-indigo-600 shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  Contrato - {clientName}
                </p>
                <p className="text-xs text-slate-400">Documento assinado e armazenado</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                disabled={loadingAction}
                onClick={handleView}
              >
                {loadingAction ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-1.5" />
                )}
                Visualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                disabled={loadingAction}
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-1.5" /> Baixar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-slate-600 border-slate-200 hover:bg-slate-50"
                disabled={loadingAction}
                onClick={handleOpenExternal}
              >
                <ExternalLink className="h-4 w-4 mr-1.5" /> Nova Aba
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-amber-600 border-amber-200 hover:bg-amber-50"
                disabled={uploading || loadingAction}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span className="ml-1.5">Substituir</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <label
            htmlFor="contract-upload-input"
            className={cn(
              'flex flex-col items-center justify-center gap-3 py-10 cursor-pointer rounded-md transition-colors',
              uploading
                ? 'bg-indigo-50/50 border border-indigo-100'
                : 'bg-slate-50/50 border border-slate-200 hover:bg-indigo-50/30 hover:border-indigo-200',
            )}
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            ) : (
              <div className="p-3 bg-indigo-50 rounded-full">
                <Upload className="h-6 w-6 text-indigo-500" />
              </div>
            )}
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700">
                {uploading ? 'Enviando contrato...' : 'Clique para enviar o contrato assinado'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Formatos aceitos: PDF, JPG, PNG (até 15MB)
              </p>
            </div>
          </label>
        )}
      </div>

      <Dialog
        open={!!pdfViewerUrl || !!pdfError}
        onOpenChange={(open) => {
          if (!open) {
            setPdfViewerUrl(null)
            setPdfError(null)
          }
        }}
      >
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b shrink-0">
            <DialogTitle className="text-lg">Visualização do Contrato - {clientName}</DialogTitle>
          </DialogHeader>
          {pdfError ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
              <div className="p-4 bg-red-50 rounded-full">
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
              <div>
                <p className="text-lg font-medium text-slate-800">Documento não encontrado</p>
                <p className="text-sm text-slate-500 mt-1">
                  O arquivo do contrato pode ter sido removido do armazenamento.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2"
              >
                <Upload className="h-4 w-4 mr-2" /> Reenviar Contrato
              </Button>
            </div>
          ) : pdfViewerUrl ? (
            <iframe
              src={pdfViewerUrl}
              className="flex-1 w-full border-0"
              title="Visualização do Contrato"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
