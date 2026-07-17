import { Rocket, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEnviarImplantacao } from '@/hooks/use-enviar-implantacao'

interface EnviarImplantacaoButtonProps {
  clienteId: string
  contratoId?: string | null
  responsavelId?: string | null
}

export function EnviarImplantacaoButton({
  clienteId,
  contratoId,
  responsavelId,
}: EnviarImplantacaoButtonProps) {
  const { enviar, isLoading } = useEnviarImplantacao()

  return (
    <Button
      onClick={() =>
        enviar({
          cliente_id: clienteId,
          contrato_id: contratoId,
          responsavel_id: responsavelId,
        })
      }
      disabled={isLoading}
      className="bg-indigo-600 hover:bg-indigo-700"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Rocket className="h-4 w-4 mr-2" />
      )}
      Enviar para Implantação
    </Button>
  )
}
