import { useState, useEffect } from 'react'
import { Info } from 'lucide-react'
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
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 flex items-center gap-2">
      <Info className="h-4 w-4 text-slate-500 shrink-0" />
      <span className="text-sm text-slate-600">
        Informação: A documentação de adesão ainda não foi totalmente aprovada na aba
        "Documentação". Este aviso é meramente informativo e não impede a geração ou formalização do
        contrato.
      </span>
    </div>
  )
}
