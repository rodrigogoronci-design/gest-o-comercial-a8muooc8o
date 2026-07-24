import { useState } from 'react'
import { MessageCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateAdesaoWhatsappMessage } from '@/lib/document-requirements'

interface CrmWhatsappChecklistButtonProps {
  telefone: string
  planoContratado?: string
  planoId?: string | null
  clientName?: string
}

export function CrmWhatsappChecklistButton({
  telefone,
  clientName,
}: CrmWhatsappChecklistButtonProps) {
  const [loading, setLoading] = useState(false)

  const hasPhone = telefone && telefone.replace(/\D/g, '').length >= 10

  const handleClick = () => {
    if (!hasPhone) return
    setLoading(true)
    const message = generateAdesaoWhatsappMessage(clientName || '')
    const cleanPhone = telefone.replace(/\D/g, '')
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
    setTimeout(() => setLoading(false), 500)
  }

  return (
    <div className="space-y-1 rounded-lg border border-green-200 bg-green-50/50 p-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2 text-green-600 border-green-300 hover:bg-green-100 hover:text-green-700 w-full"
        onClick={handleClick}
        disabled={!hasPhone || loading}
        title={!hasPhone ? 'Adicione um telefone ao prospect antes de enviar.' : ''}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MessageCircle className="h-4 w-4" />
        )}
        Enviar Ficha de Adesão via WhatsApp
      </Button>
      {!hasPhone && (
        <p className="text-xs text-amber-600">
          Adicione um telefone ao prospect antes de enviar a ficha.
        </p>
      )}
      {hasPhone && (
        <p className="text-xs text-muted-foreground">
          Clique para abrir o WhatsApp com a lista completa de documentos de adesão.
        </p>
      )}
    </div>
  )
}
