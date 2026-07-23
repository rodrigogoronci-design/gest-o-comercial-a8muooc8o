import { useState, useRef } from 'react'
import { Upload, FileText, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface DocumentoAdesao {
  nome: string
  url: string
  tipo: string
  tamanho?: number
}

interface CrmAdhesionDocumentsProps {
  prospectId?: string
  documents: DocumentoAdesao[]
  onDocumentsChange: (docs: DocumentoAdesao[]) => void
  disabled?: boolean
  skipDbUpdate?: boolean
}

export function CrmAdhesionDocuments({
  prospectId,
  documents,
  onDocumentsChange,
  disabled,
  skipDbUpdate,
}: CrmAdhesionDocumentsProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const persistToDb = async (docs: DocumentoAdesao[]) => {
    if (!prospectId || skipDbUpdate) return
    const { error } = await supabase
      .from('crm_prospects')
      .update({ documentos_adesao: docs })
      .eq('id', prospectId)
    if (error) throw error
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setUploading(true)
    try {
      const folder = prospectId || `temp/${Date.now()}`
      const newDocs: DocumentoAdesao[] = []
      for (const file of files) {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'file'
        const fileName = `${folder}/adesao/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('prospect-documents')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage
          .from('prospect-documents')
          .getPublicUrl(fileName)

        newDocs.push({
          nome: file.name,
          url: publicUrlData.publicUrl,
          tipo: fileExt,
          tamanho: file.size,
        })
      }
      const updatedDocs = [...documents, ...newDocs]
      onDocumentsChange(updatedDocs)
      await persistToDb(updatedDocs)
      toast({
        title: 'Documentos enviados',
        description: `${newDocs.length} arquivo(s) enviado(s) com sucesso.`,
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemove = async (index: number) => {
    const doc = documents[index]
    if (doc.url) {
      const pathMatch = doc.url.match(/\/prospect-documents\/(.+)$/)
      if (pathMatch) {
        await supabase.storage.from('prospect-documents').remove([pathMatch[1]])
      }
    }
    const updatedDocs = documents.filter((_, i) => i !== index)
    onDocumentsChange(updatedDocs)
    try {
      await persistToDb(updatedDocs)
    } catch {
      // ignore DB errors on remove
    }
    toast({ title: 'Documento removido' })
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        multiple
        onChange={handleUpload}
        className="hidden"
        id="adhesion-doc-upload"
        disabled={uploading || disabled}
      />
      <label
        htmlFor="adhesion-doc-upload"
        className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 hover:text-indigo-600 font-medium transition-colors w-fit"
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
        ) : (
          <Upload className="h-4 w-4 text-indigo-500" />
        )}
        {uploading ? 'Enviando...' : 'Selecionar arquivos (PDF, JPG, PNG)'}
      </label>

      {documents.length === 0 && !uploading && (
        <p className="text-xs text-muted-foreground">Nenhum documento anexado.</p>
      )}

      {documents.length > 0 && (
        <div className="space-y-1.5">
          {documents.map((doc, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-white border border-slate-200 rounded-md p-2"
            >
              <FileText className="h-4 w-4 text-slate-400 shrink-0" />
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex-1 truncate"
              >
                {doc.nome}
              </a>
              {doc.tamanho && (
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formatFileSize(doc.tamanho)}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground uppercase shrink-0">
                {doc.tipo}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                onClick={() => handleRemove(index)}
                disabled={disabled}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
