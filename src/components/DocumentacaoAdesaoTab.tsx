import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, Loader2, Upload, FileText, CheckCircle2, Circle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ADESAO_CHECKLIST, generateAdesaoWhatsappMessage } from '@/lib/document-requirements'
import {
  ensureChecklistForClient,
  getStatusCliente,
  ensureStatusCliente,
  updateStatusCliente,
  uploadDocumentacaoFile,
  updateItemStatus,
  removeDocumentacaoFile,
  type DocumentacaoAdesaoItem,
} from '@/services/documentacao-adesao'

interface DocumentacaoAdesaoTabProps {
  clienteId: string
  clientName: string
  telefone: string
}

export function DocumentacaoAdesaoTab({
  clienteId,
  clientName,
  telefone,
}: DocumentacaoAdesaoTabProps) {
  const [items, setItems] = useState<DocumentacaoAdesaoItem[]>([])
  const [statusGeral, setStatusGeral] = useState('Aguardando documentação')
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      await ensureStatusCliente(clienteId)
      const [docs, status] = await Promise.all([
        ensureChecklistForClient(clienteId),
        getStatusCliente(clienteId),
      ])
      setItems(docs)
      setStatusGeral(status?.status_geral || 'Aguardando documentação')
    } catch (err: any) {
      toast.error('Erro ao carregar documentação: ' + (err.message || ''))
    } finally {
      setLoading(false)
    }
  }, [clienteId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleWhatsApp = () => {
    const cleanPhone = telefone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      toast.error('Telefone inválido para WhatsApp')
      return
    }
    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(generateAdesaoWhatsappMessage(clientName))}`,
      '_blank',
    )
  }

  const handleUpload = async (itemId: string, file: File) => {
    setUploadingId(itemId)
    try {
      await uploadDocumentacaoFile(clienteId, itemId, file)
      toast.success('Documento enviado com sucesso!')
      await loadData()
    } catch (err: any) {
      toast.error('Erro ao enviar: ' + (err.message || ''))
    } finally {
      setUploadingId(null)
    }
  }

  const handleStatusChange = async (itemId: string, status: string) => {
    try {
      await updateItemStatus(itemId, status)
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, status } : i)))
    } catch (err: any) {
      toast.error('Erro ao atualizar status: ' + (err.message || ''))
    }
  }

  const handleRemoveFile = async (itemId: string) => {
    try {
      await removeDocumentacaoFile(itemId)
      toast.success('Documento removido')
      await loadData()
    } catch (err: any) {
      toast.error('Erro ao remover: ' + (err.message || ''))
    }
  }

  const handleApproveAll = async () => {
    try {
      await updateStatusCliente(clienteId, 'Recebida e Aprovada')
      setStatusGeral('Recebida e Aprovada')
      toast.success('Documentação marcada como Recebida e Aprovada!')
    } catch (err: any) {
      toast.error('Erro: ' + (err.message || ''))
    }
  }

  const grouped = ADESAO_CHECKLIST.map((cat) => ({
    ...cat,
    dbItems: items.filter((i) => i.categoria === cat.category),
  }))
  const receivedCount = items.filter(
    (i) => i.status === 'Recebida' || i.status === 'Aprovada',
  ).length

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Documentação de Adesão</h3>
          <p className="text-sm text-slate-500">
            Checklist de documentos e informações para adesão
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className={cn(
              'text-xs',
              statusGeral === 'Recebida e Aprovada'
                ? 'bg-emerald-100 text-emerald-700'
                : statusGeral === 'Documentação recebida'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-amber-100 text-amber-700',
            )}
          >
            {statusGeral}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {receivedCount}/{items.length} itens
          </Badge>
        </div>
      </div>

      <Button onClick={handleWhatsApp} className="w-full bg-green-600 hover:bg-green-700 gap-2">
        <MessageCircle className="h-4 w-4" />
        Enviar Ficha de Adesão via WhatsApp
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
                    className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md p-2"
                  >
                    {item.status === 'Aprovada' || item.status === 'Recebida' ? (
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
                        className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 shrink-0"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {item.uploaded_at
                          ? new Date(item.uploaded_at).toLocaleDateString('pt-BR')
                          : ''}
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
                    <Select
                      value={item.status}
                      onValueChange={(v) => handleStatusChange(item.id, v)}
                    >
                      <SelectTrigger className="h-7 w-[110px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Recebida">Recebida</SelectItem>
                        <SelectItem value="Aprovada">Aprovada</SelectItem>
                      </SelectContent>
                    </Select>
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
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {statusGeral !== 'Recebida e Aprovada' && (
        <Button
          onClick={handleApproveAll}
          disabled={receivedCount < items.length}
          className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          Marcar como Recebida e Aprovada
        </Button>
      )}
    </div>
  )
}
