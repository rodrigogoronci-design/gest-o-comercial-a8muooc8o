import { useState, useRef } from 'react'
import { Upload, FileText, X, Loader2, CheckCircle2, Link2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CrmPropostaUploadProps {
  prospectId: string
  currentUrl: string | null
  onUrlChange: (url: string | null) => void
  skipDbUpdate?: boolean
}

const MAX_FILE_SIZE = 10 * 1024 * 1024

function extractPathFromUrl(url: string): string | null {
  const pattern = `/storage/v1/object/public/proposals/`
  const idx = url.indexOf(pattern)
  if (idx !== -1) return decodeURIComponent(url.substring(idx + pattern.length))
  const signedPattern = `/storage/v1/object/sign/proposals/`
  const signedIdx = url.indexOf(signedPattern)
  if (signedIdx !== -1) {
    const pathPart = url.substring(signedIdx + signedPattern.length)
    const queryIdx = pathPart.indexOf('?')
    return decodeURIComponent(queryIdx !== -1 ? pathPart.substring(0, queryIdx) : pathPart)
  }
  return null
}

function getFileName(url: string): string {
  const parts = url.split('/')
  const last = parts[parts.length - 1]
  if (!last) return 'proposta.pdf'
  return last.length > 40 ? last.substring(0, 37) + '...' : last
}

export function CrmPropostaUpload({
  prospectId,
  currentUrl,
  onUrlChange,
  skipDbUpdate,
}: CrmPropostaUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [existingPropostas, setExistingPropostas] = useState<any[]>([])
  const [loadingPropostas, setLoadingPropostas] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const deleteOldFile = async (url: string | null) => {
    if (!url) return
    const path = extractPathFromUrl(url)
    if (!path) return
    try {
      await supabase.storage.from('proposals').remove([path])
    } catch {
      // ignore deletion errors
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Arquivo inválido',
        description: 'Apenas arquivos PDF são aceitos.',
        variant: 'destructive',
      })
      e.target.value = ''
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo permitido é 10 MB.',
        variant: 'destructive',
      })
      e.target.value = ''
      return
    }

    setUploading(true)
    try {
      if (currentUrl) {
        await deleteOldFile(currentUrl)
      }

      const folder = prospectId || `temp/${Date.now()}`
      const fileExt = file.name.split('.').pop() || 'pdf'
      const fileName = `${folder}/proposta-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('proposals')
        .upload(fileName, file, { upsert: false })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage.from('proposals').getPublicUrl(fileName)

      const newUrl = publicUrlData.publicUrl

      if (prospectId && !skipDbUpdate) {
        const { error: updateError } = await supabase
          .from('crm_prospects')
          .update({
            proposta_url: newUrl,
            proposta_anexada_em: new Date().toISOString(),
          })
          .eq('id', prospectId)

        if (updateError) throw updateError
      }

      onUrlChange(newUrl)
      toast({ title: 'Proposta anexada com sucesso!' })
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar arquivo',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemove = async () => {
    if (!currentUrl) return
    setUploading(true)
    try {
      await deleteOldFile(currentUrl)
      if (prospectId && !skipDbUpdate) {
        const { error } = await supabase
          .from('crm_prospects')
          .update({ proposta_url: null, proposta_anexada_em: null })
          .eq('id', prospectId)
        if (error) throw error
      }
      onUrlChange(null)
      toast({ title: 'Proposta removida' })
    } catch (error: any) {
      toast({
        title: 'Erro ao remover',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleOpenLinkModal = async () => {
    setShowLinkModal(true)
    setLoadingPropostas(true)
    try {
      const { data } = await supabase
        .from('crm_propostas')
        .select(
          'id, data_proposta, valor_mensalidade, valor_implantacao, documento_url, status_negociacao, aos_cuidados_de',
        )
        .eq('prospect_id', prospectId)
        .not('documento_url', 'is', null)
        .order('created_at', { ascending: false })
      setExistingPropostas(data || [])
    } catch {
      setExistingPropostas([])
    } finally {
      setLoadingPropostas(false)
    }
  }

  const handleLinkExisting = async (url: string) => {
    setUploading(true)
    try {
      if (prospectId && !skipDbUpdate) {
        const { error } = await supabase
          .from('crm_prospects')
          .update({
            proposta_url: url,
            proposta_anexada_em: new Date().toISOString(),
          })
          .eq('id', prospectId)
        if (error) throw error
      }
      onUrlChange(url)
      setShowLinkModal(false)
      toast({ title: 'Proposta vinculada com sucesso!' })
    } catch (error: any) {
      toast({
        title: 'Erro ao vincular',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Proposta Anexada</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleOpenLinkModal}
          disabled={uploading}
        >
          <Link2 className="h-3.5 w-3.5 mr-1.5" />
          Vincular Proposta Existente
        </Button>
      </div>

      {currentUrl ? (
        <div className="flex items-center gap-3 p-4 border border-emerald-200 bg-emerald-50/50 rounded-lg">
          <div className="bg-emerald-100 w-10 h-10 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="text-sm font-medium text-slate-800 truncate">
                {getFileName(currentUrl)}
              </span>
            </div>
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 mt-0.5"
            >
              <Download className="h-3 w-3" />
              Baixar Proposta
            </a>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              <span className="ml-1.5">Substituir</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-6 transition-colors',
            'border-slate-200 bg-slate-50/50 hover:border-indigo-300 hover:bg-indigo-50/30',
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex flex-col items-center justify-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors"
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            ) : (
              <Upload className="h-8 w-8 text-indigo-400" />
            )}
            <span className="text-sm font-medium">
              {uploading ? 'Enviando...' : 'Anexar Proposta Enviada'}
            </span>
            <span className="text-xs text-muted-foreground">Apenas PDF, máximo 10 MB</span>
          </button>
        </div>
      )}

      <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Vincular Proposta Existente</DialogTitle>
            <DialogDescription>
              Selecione uma proposta gerada anteriormente para vincular ao prospecto.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {loadingPropostas ? (
              <div className="py-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-400 mx-auto" />
              </div>
            ) : existingPropostas.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Nenhuma proposta com documento encontrado para este prospecto.
              </div>
            ) : (
              existingPropostas.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleLinkExisting(p.documento_url)}
                  disabled={uploading}
                  className="w-full text-left p-3 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors flex items-center gap-3"
                >
                  <div className="bg-indigo-50 w-9 h-9 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800">
                      Proposta de{' '}
                      {new Date(p.data_proposta + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>
                        Mensal:{' '}
                        {p.valor_mensalidade?.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </span>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                        {p.status_negociacao || 'Gerada'}
                      </span>
                    </div>
                  </div>
                  <Link2 className="h-4 w-4 text-indigo-500 shrink-0" />
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
