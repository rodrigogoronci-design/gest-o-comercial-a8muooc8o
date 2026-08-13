import { useState, useEffect, useCallback } from 'react'
import { Star, Send, Loader2, Mail, MessageSquare, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  getOrCreateAvaliacaoTreinamento,
  getAvaliacaoByImplementacao,
  markAvaliacaoEnviada,
  generateAvaliacaoUrl,
  sendAvaliacaoEmail,
  type AvaliacaoTreinamento,
} from '@/services/avaliacao-treinamento'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TreinamentoEvaluationSectionProps {
  implId: string
  clienteNome: string | null
  clienteEmail: string | null
  treinamentoMotivo: string | null
  modulosNovos: string[] | null
  analistaNome: string | null
}

export function TreinamentoEvaluationSection({
  implId,
  clienteNome,
  clienteEmail,
  treinamentoMotivo,
  modulosNovos,
  analistaNome,
}: TreinamentoEvaluationSectionProps) {
  const [avaliacao, setAvaliacao] = useState<AvaliacaoTreinamento | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sharingWhatsapp, setSharingWhatsapp] = useState(false)

  const loadAvaliacao = useCallback(async () => {
    try {
      const data = await getAvaliacaoByImplementacao(implId)
      setAvaliacao(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [implId])

  useEffect(() => {
    loadAvaliacao()
  }, [loadAvaliacao])

  const trainingTitle =
    treinamentoMotivo ||
    (modulosNovos && modulosNovos.length > 0 ? modulosNovos.join(', ') : 'Treinamento')

  const handleSendEmail = async () => {
    if (!clienteEmail) {
      toast.error('Cliente não possui e-mail cadastrado.')
      return
    }
    setSending(true)
    try {
      const aval = await getOrCreateAvaliacaoTreinamento(implId)
      const url = generateAvaliacaoUrl(aval.token)
      await sendAvaliacaoEmail({
        to: clienteEmail,
        clientName: clienteNome || 'Cliente',
        evaluationLink: url,
        trainingTitle,
        senderName: analistaNome || 'Equipe Service Logic',
      })
      await markAvaliacaoEnviada(aval.id)
      await loadAvaliacao()
      toast.success('Link de avaliação enviado por e-mail!')
    } catch (error: any) {
      toast.error('Erro ao enviar avaliação: ' + (error.message || ''))
    } finally {
      setSending(false)
    }
  }

  const handleShareWhatsapp = async () => {
    setSharingWhatsapp(true)
    try {
      const aval = await getOrCreateAvaliacaoTreinamento(implId)
      const url = generateAvaliacaoUrl(aval.token)
      const msg = encodeURIComponent(
        `Olá! Gostaríamos de solicitar sua avaliação sobre o treinamento recebido. Acesse o link: ${url}`,
      )
      window.open(`https://wa.me/?text=${msg}`, '_blank', 'noopener,noreferrer')
      if (aval.status === 'nao_enviada') {
        await markAvaliacaoEnviada(aval.id)
        await loadAvaliacao()
      }
    } catch (error: any) {
      toast.error('Erro ao gerar link: ' + (error.message || ''))
    } finally {
      setSharingWhatsapp(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 text-violet-500 animate-spin" />
      </div>
    )
  }

  const isEvaluated = avaliacao?.status === 'avaliada'
  const isSent = avaliacao?.status === 'enviada'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isEvaluated ? (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Avaliada
            </Badge>
          ) : isSent ? (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200">
              <Clock className="h-3 w-3 mr-1" />
              Aguardando avaliação
            </Badge>
          ) : (
            <Badge className="bg-slate-50 text-slate-600 border-slate-200">Não enviada</Badge>
          )}
        </div>
        {!isEvaluated && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendEmail}
              disabled={sending}
              className="border-violet-300 text-violet-700 hover:bg-violet-50"
            >
              {sending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Mail className="h-3.5 w-3.5 mr-1.5" />
              )}
              <span className="hidden sm:inline">Enviar por E-mail</span>
              <span className="sm:hidden">E-mail</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareWhatsapp}
              disabled={sharingWhatsapp}
              style={{ borderColor: '#25D366', color: '#25D366' }}
              className="hover:bg-[#25D366] hover:text-white"
            >
              {sharingWhatsapp ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
              )}
              <span className="hidden sm:inline">WhatsApp</span>
            </Button>
          </div>
        )}
      </div>

      {isEvaluated && avaliacao ? (
        <Card className="border-emerald-200">
          <CardContent className="p-5 space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Nota</p>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-6 w-6',
                      i < (avaliacao.nota || 0)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300',
                    )}
                  />
                ))}
                <span className="ml-2 text-sm font-medium text-slate-700">{avaliacao.nota}/5</span>
              </div>
            </div>
            {avaliacao.comentarios && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Comentários</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {avaliacao.comentarios}
                </p>
              </div>
            )}
            {avaliacao.data_avaliacao && (
              <p className="text-xs text-muted-foreground">
                Avaliado em {new Date(avaliacao.data_avaliacao).toLocaleString('pt-BR')}
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
          <p className="text-sm text-slate-600">
            {isSent
              ? 'O link de avaliação foi enviado ao cliente. Aguardando resposta.'
              : 'Nenhuma avaliação enviada ainda. Use os botões acima para enviar o link de avaliação ao cliente.'}
          </p>
          {avaliacao?.data_envio && (
            <p className="text-xs text-muted-foreground mt-2">
              Link enviado em {new Date(avaliacao.data_envio).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
