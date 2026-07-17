import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createImplementacao } from '@/services/implementacoes'
import { toast } from 'sonner'

export function useEnviarImplantacao() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const enviar = async (params: {
    cliente_id: string
    contrato_id?: string | null
    responsavel_id?: string | null
  }) => {
    setIsLoading(true)
    try {
      const data = await createImplementacao(params)
      toast.success('Implantação criada com sucesso!')
      navigate(`/implementacoes/${data.id}`)
      return data
    } catch (error: any) {
      toast.error('Erro ao criar implantação: ' + (error.message || ''))
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { enviar, isLoading }
}
