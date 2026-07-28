import { CaptacaoSimplifiedForm } from '@/components/CaptacaoSimplifiedForm'

export default function CaptacaoPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Captação de Leads</h1>
        <p className="text-muted-foreground mt-1">
          Registre rapidamente um contato após a visita e envie a apresentação institucional via
          WhatsApp.
        </p>
      </div>
      <CaptacaoSimplifiedForm />
    </div>
  )
}
