import { useState, useRef } from 'react'
import { FileText, Upload, Trash2, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { uploadRatUnificado, updateRatUnificado } from '@/services/implementacoes'
import { toast } from 'sonner'

interface RatUnificadoCardProps {
  implementacaoId: string
  ratUrl: string | null | undefined
  label?: string
  onUpdated: (newUrl: string | null) => void
}

export function RatUnificadoCard({
  implementacaoId,
  ratUrl,
  label = 'RAT Unificado — documenta todos os treinamentos',
  onUpdated,
}: RatUnificadoCardProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Por favor, selecione um arquivo em formato PDF.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setIsUploading(true)
    try {
      const publicUrl = await uploadRatUnificado(file, implementacaoId)
      await updateRatUnificado(implementacaoId, publicUrl)
      toast.success('RAT Unificado anexado com sucesso!')
      onUpdated(publicUrl)
    } catch (error: any) {
      toast.error('Erro ao enviar RAT Unificado: ' + (error.message || ''))
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemove = async () => {
    if (!confirm('Deseja realmente remover o RAT Unificado desta implementação?')) {
      return
    }
    setIsRemoving(true)
    try {
      await updateRatUnificado(implementacaoId, null)
      toast.success('RAT Unificado removido.')
      onUpdated(null)
    } catch (error: any) {
      toast.error('Erro ao remover RAT Unificado: ' + (error.message || ''))
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <Card className="border border-slate-200 bg-slate-50/50 shadow-sm mb-4">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-semibold text-slate-800">{label}</span>
              {ratUrl && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" /> Anexado
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Formato recomendado: PDF assinado pelo cliente ou analista.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading || isRemoving}
            />

            {ratUrl ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  asChild
                >
                  <a href={ratUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    Visualizar RAT
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isRemoving}
                >
                  {isUploading ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5 mr-1" />
                  )}
                  Substituir
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleRemove}
                  disabled={isUploading || isRemoving}
                >
                  {isRemoving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isRemoving}
              >
                {isUploading ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5 mr-1" />
                )}
                Anexar RAT Unificado (PDF)
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
