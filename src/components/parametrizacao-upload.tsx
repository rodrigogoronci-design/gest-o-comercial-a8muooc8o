import { useState, useRef } from 'react'
import { Upload, FileText, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ParametrizacaoUploadProps {
  implementacaoId: string
  label: string
  currentUrl: string | null
  onUrlChange: (url: string | null) => void
}

export function ParametrizacaoUpload({
  implementacaoId,
  label,
  currentUrl,
  onUrlChange,
}: ParametrizacaoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputId = `param-${label.toLowerCase().replace(/\s+/g, '-')}-${implementacaoId}`

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const slug = label.toLowerCase().replace(/\s+/g, '-')
      const fileName = `${implementacaoId}/parametrizacao/${slug}-${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('implementacao-docs')
        .upload(fileName, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('implementacao-docs').getPublicUrl(fileName)
      onUrlChange(data.publicUrl)
      toast.success('Documento enviado com sucesso!')
    } catch (err: any) {
      toast.error('Erro ao enviar arquivo: ' + (err.message || ''))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-lg p-2.5 transition-colors',
        currentUrl ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-slate-50/50',
      )}
    >
      {currentUrl ? (
        <div className="flex items-center gap-2">
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium flex-1 truncate"
          >
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Ver documento</span>
          </a>
          <button
            type="button"
            onClick={() => onUrlChange(null)}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleUpload}
            className="hidden"
            id={inputId}
            accept=".pdf,.png,.jpg,.jpeg,.pfx,.p12"
          />
          <label
            htmlFor={inputId}
            className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 hover:text-indigo-600 font-medium transition-colors"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
            ) : (
              <Upload className="h-3.5 w-3.5 text-indigo-500" />
            )}
            {uploading ? 'Enviando...' : 'Selecionar arquivo'}
          </label>
        </div>
      )}
    </div>
  )
}
