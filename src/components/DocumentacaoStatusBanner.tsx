import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { getStatusCliente } from '@/services/documentacao-adesao'

export function DocumentacaoStatusBanner({ clienteId }: { clienteId: string }) {
  const [approved, setApproved] = useState<boolean | null>(null)

  useEffect(() => {
    getStatusCliente(clienteId)
      .then((s) => setApproved(s?.status_geral === 'Recebida e Aprovada'))
      .catch(() => setApproved(null))
  }, [clienteId])

  if (approved === true || approved === null) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-center gap-2">
      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
      <span className="text-sm text-amber-800">
        A documentação de adesão ainda não foi totalmente aprovada. Complete a checklist na aba
        "Documentação" antes de prosseguir com o contrato.
      </span>
    </div>
  )
}
