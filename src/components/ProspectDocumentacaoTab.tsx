import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, Loader2, Upload, FileText, CheckCircle2, Circle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ADESAO_CHECKLIST, generateAdesaoWhatsappMessage } from '@/lib/document-requirements'
import {
  ensureChecklistForProspect,
  uploadProspectDocumentFile,
  updateProspectItemStatus,
  updateProspectItemObservacoes,
  removeProspectDocumentFile,
  type ProspectDocumentacaoItem,
} from '@/services/prospect-documentacao'

interface Props {
  prospectId: string
  prospectName: string
  telefone: string
}

export function ProspectDocumentacaoTab({ prospectId, prospectName, telefone }: Props) {
  const [items, setItems] = useState<ProspectDocumentacaoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const { toast } = useToast()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await ensureChecklistForProspect(prospectId))
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [prospectId, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleUpload = async (itemId: string, file: File) => {
    setUploadingId(itemId)
    try {
      await uploadProspectDocumentFile(prospectId, itemId, file)
      toast({ title: 'Documento enviado com sucesso!' })
      await loadData()
    } catch (err: any) {
      toast({ title: 'Erro ao enviar', description: err.message, variant: 'destructive' })
    } finally {
      setUploadingId(null)
    }
  }

  const handleStatusChange = async (itemId: string, status: string) => {
    try {
      await updateProspectItemStatus(itemId, status)
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, status } : i)))
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const handleObsBlur = async (itemId: string, obs: string) => {
    try {
      await updateProspectItemObservacoes(itemId, obs)
    } catch {
      toast({ title: 'Erro ao salvar observação', variant: 'destructive' })
    }
  }

  const handleRemoveFile = async (itemId: string) => {
    try {
      await removeProspectDocumentFile(itemId)
      toast({ title: 'Documento removido' })
      await loadData()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const handleWhatsApp = () => {
    const msg = generateAdesaoWhatsappMessage(prospectName)
    const cleanPhone = telefone.replace(/\D/g, '')
    if (cleanPhone.length >= 10) {
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank')
    } else {
      navigator.clipboard.writeText(msg)
      toast({
        title: 'Mensagem copiada',
        description: 'Telefone não cadastrado. Cole no WhatsApp.',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    )
  }

  const grouped = ADESAO_CHECKLIST.map((cat) => ({
    ...cat,
    dbItems: items.filter((i) => i.categoria === cat.category),
  }))
  const approvedCount = items.filter((i) => i.status === 'Aprovado').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Documentação</h3>
          <p className="text-sm text-slate-500">Checklist de documentos para adesão</p>
        </div>
        <Badge variant="outline" className="text-xs">
          {approvedCount}/{items.length} aprovados
        </Badge>
      </div>
      <Button onClick={handleWhatsApp} className="w-full bg-green-600 hover:bg-green-700 gap-2">
        <MessageCircle className="h-4 w-4" /> Enviar via WhatsApp
      </Button>
      <Accordion
        type="multiple"
        defaultValue={ADESAO_CHECKLIST.map((c) => c.category)}
        className="w-full"
      >
        {grouped.map((cat) => (
          <AccordionItem key={cat.category} value={cat.category}>
            <AccordionTrigger className="text-sm font-semibold text-slate-700">
              {cat.category}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {cat.dbItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-1.5 bg-slate-50 border border-slate-200 rounded-md p-2"
                  >
                    <div className="flex items-center gap-2">
                      {item.status === 'Aprovado' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                      )}
                      <span className="text-sm text-slate-700 flex-1 truncate">{item.item}</span>
                      {item.arquivo_url && (
                        <a
                          href={item.arquivo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:text-indigo-800"
                        >
                          <FileText className="h-3.5 w-3.5 inline" />
                        </a>
                      )}
                      <input
                        ref={(el) => {
                          fileRefs.current[item.id] = el
                        }}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) handleUpload(item.id, f)
                          if (fileRefs.current[item.id]) fileRefs.current[item.id]!.value = ''
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-indigo-600 hover:bg-indigo-50"
                        disabled={uploadingId === item.id}
                        onClick={() => fileRefs.current[item.id]?.click()}
                      >
                        {uploadingId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      {item.arquivo_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                          onClick={() => handleRemoveFile(item.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Select
                        value={item.status}
                        onValueChange={(v) => handleStatusChange(item.id, v)}
                      >
                        <SelectTrigger className="h-7 w-[120px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Aguardando">Aguardando</SelectItem>
                          <SelectItem value="Recebido">Recebido</SelectItem>
                          <SelectItem value="Aprovado">Aprovado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      placeholder="Observações..."
                      className="h-7 text-xs"
                      defaultValue={item.observacoes || ''}
                      onBlur={(e) => handleObsBlur(item.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
