import { useState, useEffect, useCallback } from 'react'
import { FileText, UploadCloud, Eye, Trash2, Loader2, FileCheck2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/formatters'

type PlanoSaude = {
  id: string
  descricao: string
  codigo: string
  valor_titular: number | null
}

export function CrmDiagnosticoForm({
  prospectId,
  initialPlanoId,
  initialPropostaUrl,
  initialContratoUrl,
  onSave,
}: {
  prospectId: string
  initialPlanoId?: string | null
  initialPropostaUrl?: string | null
  initialContratoUrl?: string | null
  onSave: () => void
}) {
  const [planos, setPlanos] = useState<PlanoSaude[]>([])
  const [selectedPlanoId, setSelectedPlanoId] = useState<string>(initialPlanoId || '')
  const [propostaUrl, setPropostaUrl] = useState<string | null>(initialPropostaUrl || null)
  const [contratoUrl, setContratoUrl] = useState<string | null>(initialContratoUrl || null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingPlanos, setIsLoadingPlanos] = useState(true)
  const [uploadingField, setUploadingField] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    setSelectedPlanoId(initialPlanoId || '')
    setPropostaUrl(initialPropostaUrl || null)
    setContratoUrl(initialContratoUrl || null)
  }, [initialPlanoId, initialPropostaUrl, initialContratoUrl])

  useEffect(() => {
    const fetchPlanos = async () => {
      const { data, error } = await supabase
        .from('planos_saude')
        .select('id, descricao, codigo, valor_titular')
        .order('descricao', { ascending: true })
      if (!error && data) {
        setPlanos(data as PlanoSaude[])
      }
      setIsLoadingPlanos(false)
    }
    fetchPlanos()
  }, [])

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${prospectId}/${folder}-${Date.now()}-${safeName}`
    const { error } = await supabase.storage.from('prospect-documents').upload(fileName, file)
    if (error) {
      toast({ title: 'Erro no upload', description: error.message, variant: 'destructive' })
      return null
    }
    return fileName
  }

  const removeFile = async (path: string) => {
    const { error } = await supabase.storage.from('prospect-documents').remove([path])
    if (error) {
      toast({
        title: 'Erro ao remover arquivo',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, field: 'proposta' | 'contrato') => {
      const file = e.target.files?.[0]
      if (!file) return
      setUploadingField(field)

      try {
        if (field === 'proposta' && propostaUrl) {
          await removeFile(propostaUrl)
        }
        if (field === 'contrato' && contratoUrl) {
          await removeFile(contratoUrl)
        }

        const uploadedPath = await uploadFile(file, field)
        if (!uploadedPath) return

        const dbField = field === 'proposta' ? 'proposta_url' : 'contrato_assinado_url'
        const { error: dbError } = await supabase
          .from('crm_prospects')
          .update({ [dbField]: uploadedPath })
          .eq('id', prospectId)

        if (dbError) throw dbError

        if (field === 'proposta') {
          setPropostaUrl(uploadedPath)
        } else {
          setContratoUrl(uploadedPath)
        }

        toast({ title: 'Sucesso', description: 'Arquivo anexado com sucesso!' })
      } catch (err: any) {
        toast({ title: 'Erro', description: err.message, variant: 'destructive' })
      } finally {
        setUploadingField(null)
        e.target.value = ''
      }
    },
    [propostaUrl, contratoUrl, prospectId, toast],
  )

  const handleRemoveFile = async (field: 'proposta' | 'contrato') => {
    const currentPath = field === 'proposta' ? propostaUrl : contratoUrl
    if (!currentPath) return
    setUploadingField(field)

    try {
      await removeFile(currentPath)
      const dbField = field === 'proposta' ? 'proposta_url' : 'contrato_assinado_url'
      const { error } = await supabase
        .from('crm_prospects')
        .update({ [dbField]: null })
        .eq('id', prospectId)
      if (error) throw error

      if (field === 'proposta') {
        setPropostaUrl(null)
      } else {
        setContratoUrl(null)
      }
      toast({ title: 'Sucesso', description: 'Arquivo removido.' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setUploadingField(null)
    }
  }

  const handleViewFile = (path: string) => {
    const { data } = supabase.storage.from('prospect-documents').getPublicUrl(path)
    window.open(data.publicUrl, '_blank')
  }

  const handleSavePlano = async () => {
    setIsSubmitting(true)
    const { error } = await supabase
      .from('crm_prospects')
      .update({ plano_id: selectedPlanoId || null })
      .eq('id', prospectId)
    setIsSubmitting(false)
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Sucesso', description: 'Plano contratado salvo com sucesso!' })
    onSave()
  }

  const getFileName = (path: string) => {
    const parts = path.split('/')
    return parts[parts.length - 1] || path
  }

  const FileUploadCard = ({
    field,
    label,
    description,
    fileUrl,
  }: {
    field: 'proposta' | 'contrato'
    label: string
    description: string
    fileUrl: string | null
  }) => {
    const isUploading = uploadingField === field
    return (
      <Card className="border-slate-200/60 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-800">{label}</CardTitle>
            {fileUrl && (
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border border-emerald-200">
                <FileCheck2 className="h-3 w-3 mr-1" /> Anexado
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {fileUrl ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-emerald-50 border border-emerald-100 p-3 rounded-lg gap-3">
              <div className="flex items-center gap-2 text-emerald-700 overflow-hidden min-w-0">
                <FileText className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium truncate" title={getFileName(fileUrl)}>
                  {getFileName(fileUrl)}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                  onClick={() => handleViewFile(fileUrl)}
                  disabled={isUploading}
                >
                  <Eye className="w-4 h-4 mr-1.5" /> Visualizar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleRemoveFile(field)}
                  disabled={isUploading}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden"
                id={`upload-${field}`}
                disabled={isUploading}
                onChange={(e) => handleFileUpload(e, field)}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={isUploading}
                onClick={() => document.getElementById(`upload-${field}`)?.click()}
                className="gap-2"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UploadCloud className="w-4 h-4" />
                )}
                {isUploading ? 'Enviando...' : 'Fazer Upload'}
              </Button>
              <span className="text-sm text-slate-500">
                Formatos aceitos: PDF, DOC, DOCX, JPG, PNG
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">Plano Contratado</CardTitle>
          <CardDescription className="text-xs">
            Selecione o plano de saúde contratado pelo cliente antes do envio para implantação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="plano-select" className="text-sm font-medium text-slate-700">
                Plano Contratado
              </Label>
              {isLoadingPlanos ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando planos...
                </div>
              ) : (
                <Select value={selectedPlanoId} onValueChange={setSelectedPlanoId}>
                  <SelectTrigger id="plano-select" className="bg-white">
                    <SelectValue placeholder="Selecione um plano..." />
                  </SelectTrigger>
                  <SelectContent>
                    {planos.length === 0 ? (
                      <SelectItem value="_empty" disabled>
                        Nenhum plano cadastrado
                      </SelectItem>
                    ) : (
                      planos.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.descricao}
                          {p.codigo ? ` (${p.codigo})` : ''}
                          {p.valor_titular != null && p.valor_titular > 0
                            ? ` — ${formatCurrency(p.valor_titular)}/mês`
                            : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex justify-end pt-1">
              <Button
                type="button"
                onClick={handleSavePlano}
                disabled={isSubmitting || isLoadingPlanos}
                size="sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Plano'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <FileUploadCard
        field="proposta"
        label="Anexar Proposta"
        description="Documento da proposta comercial enviada ao cliente."
        fileUrl={propostaUrl}
      />

      <FileUploadCard
        field="contrato"
        label="Anexar Contrato Assinado"
        description="Contrato assinado pelo cliente, necessário antes da ativação."
        fileUrl={contratoUrl}
      />

      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-lg p-4">
        <ShieldCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">Checklist de Implantação</p>
          <p className="text-blue-700">
            Certifique-se de que o plano contratado e os documentos (proposta e contrato assinado)
            estejam anexados antes de mover o lead para "Enviado para Implantação".
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            <span
              className={`text-xs font-medium ${selectedPlanoId ? 'text-emerald-700' : 'text-slate-500'}`}
            >
              {selectedPlanoId ? '✓' : '○'} Plano selecionado
            </span>
            <span
              className={`text-xs font-medium ${propostaUrl ? 'text-emerald-700' : 'text-slate-500'}`}
            >
              {propostaUrl ? '✓' : '○'} Proposta anexada
            </span>
            <span
              className={`text-xs font-medium ${contratoUrl ? 'text-emerald-700' : 'text-slate-500'}`}
            >
              {contratoUrl ? '✓' : '○'} Contrato assinado
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
