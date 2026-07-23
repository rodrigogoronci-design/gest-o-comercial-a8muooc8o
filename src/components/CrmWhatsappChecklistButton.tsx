import { useState } from 'react'
import { MessageCircle, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getDocumentosObrigatorios } from '@/services/documentos-obrigatorios'

interface CrmWhatsappChecklistButtonProps {
  telefone: string
  planoContratado: string
  planoId?: string | null
}

export function CrmWhatsappChecklistButton({
  telefone,
  planoContratado,
  planoId,
}: CrmWhatsappChecklistButtonProps) {
  const [loading, setLoading] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)

  const hasPhone = telefone && telefone.replace(/\D/g, '').length >= 10

  const handleClick = async () => {
    if (!hasPhone) return
    setLoading(true)
    setWarning(null)
    try {
      const docs = await getDocumentosObrigatorios(planoId)
      if (docs.length === 0) {
        setWarning(
          'Nenhum documento obrigatório configurado. Configure-os no painel de administração.',
        )
        return
      }

      const docList = docs.map((d, i) => `${i + 1}. ${d.nome_documento}`).join('\n')
      const planoNome = planoContratado || 'Plano Contratado'
      const message = `Olá! Recebemos sua aceitação da proposta para o plano: ${planoNome}.\nPara darmos continuidade à sua adesão, precisamos que nos envie os seguintes documentos:\n${docList}\n\nFique à vontade para enviar os arquivos por aqui mesmo. Qualquer dúvida, estou à disposição!`

      const cleanPhone = telefone.replace(/\D/g, '')
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')
    } catch {
      setWarning('Erro ao carregar documentos obrigatórios.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1 rounded-lg border border-green-200 bg-green-50/50 p-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 text-green-600 border-green-300 hover:bg-green-100 hover:text-green-700"
          onClick={handleClick}
          disabled={!hasPhone || loading}
          title={!hasPhone ? 'Adicione um telefone ao prospect antes de enviar a lista.' : ''}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageCircle className="h-4 w-4" />
          )}
          Enviar Lista de Documentos via WhatsApp
        </Button>
      </div>
      {!hasPhone && (
        <p className="text-xs text-amber-600">
          Adicione um telefone ao prospect antes de enviar a lista.
        </p>
      )}
      {warning && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 shrink-0" /> {warning}
        </p>
      )}
      {hasPhone && !warning && (
        <p className="text-xs text-muted-foreground">
          Clique no link para abrir o WhatsApp e enviar a lista ao cliente.
        </p>
      )}
    </div>
  )
}
