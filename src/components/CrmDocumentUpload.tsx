import { useState, useRef } from 'react'
import { Upload, FileText, X, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface CrmDocumentUploadProps {
  prospectId: string
  label: string
  currentUrl: string | null
  onUrlChange: (url: string | null) => void
  required?: boolean
}

export function CrmDocumentUpload({
  prospectId,
  label,
  currentUrl,
  onUrlChange,
  required = false,
}: CrmDocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const inputId = `upload-${label.toLowerCase().replace(/\s+/g, '-')}`

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${prospectId}/${label.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('prospect-documents')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('prospect-documents')
        .getPublicUrl(fileName)

      onUrlChange(publicUrlData.publicUrl)
      toast({ title: 'Documento enviado com sucesso!' })
    } catch (error: any) {
      toast({ title: 'Erro ao enviar arquivo', description: error.message, variant: 'destructive' })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemove = () => {
    onUrlChange(null)
    toast({ title: 'Documento removido' })
  }

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-lg p-4 transition-colors',
        currentUrl
          ? 'border-emerald-200 bg-emerald-50/50'
          : required
            ? 'border-amber-200 bg-amber-50/30'
            : 'border-slate-200 bg-slate-50/50',
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
        {currentUrl && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
      </div>
      {currentUrl ? (
        <div className="flex items-center gap-2">
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium flex-1 truncate"
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate">Ver documento</span>
          </a>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={handleRemove}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleUpload}
            className="hidden"
            id={inputId}
          />
          <label
            htmlFor={inputId}
            className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 hover:text-indigo-600 font-medium transition-colors"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
            ) : (
              <Upload className="h-4 w-4 text-indigo-500" />
            )}
            {uploading ? 'Enviando...' : 'Selecionar arquivo'}
          </label>
        </div>
      )}
    </div>
  )
}
