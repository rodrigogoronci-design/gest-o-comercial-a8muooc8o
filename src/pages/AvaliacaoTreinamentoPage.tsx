import { useState, useEffect, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { Star, Loader2, AlertCircle, CheckCircle2, Check, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50/40 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  )
}

export default function AvaliacaoTreinamentoPage() {
  const { token } = useParams<{ token: string }>()
  const [loading, setLoading] = useState(true)
  const [avalData, setAvalData] = useState<any>(null)
  const [invalid, setInvalid] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [alreadyEvaluated, setAlreadyEvaluated] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comments, setComments] = useState('')

  useEffect(() => {
    if (!token) {
      setInvalid(true)
      setLoading(false)
      return
    }
    supabase.rpc('get_avaliacao_treinamento', { p_token: token }).then(({ data, error }) => {
      if (error || !data) {
        setInvalid(true)
      } else {
        setAvalData(data)
        if (data.status === 'avaliada') {
          setAlreadyEvaluated(true)
          setRating(data.nota || 0)
          setComments(data.comentarios || '')
        }
      }
      setLoading(false)
    })
  }, [token])

  const handleSubmit = async () => {
    if (!token || rating === 0) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const { data, error } = await supabase.rpc('submit_avaliacao_treinamento', {
        p_token: token,
        p_nota: rating,
        p_comentarios: comments,
      })
      if (error) throw new Error('Erro ao enviar avaliação')
      if (data) setSuccess(true)
      else setInvalid(true)
    } catch (e: any) {
      setSubmitError(e.message || 'Erro ao enviar avaliação. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading)
    return (
      <PageShell>
        <Card className="shadow-xl">
          <CardContent className="p-12 flex flex-col items-center">
            <Loader2 className="h-10 w-10 text-violet-500 animate-spin mb-4" />
            <p className="text-sm text-slate-500">Carregando avaliação...</p>
          </CardContent>
        </Card>
      </PageShell>
    )

  if (invalid)
    return (
      <PageShell>
        <Card className="shadow-xl">
          <CardContent className="p-12 flex flex-col items-center text-center">
            <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-700">Link expirado ou inválido</p>
            <p className="text-sm text-muted-foreground mt-1">
              Este link pode ter expirado ou é inválido. Entre em contato com o responsável pelo
              treinamento.
            </p>
          </CardContent>
        </Card>
      </PageShell>
    )

  if (success || alreadyEvaluated)
    return (
      <PageShell>
        <Card className="shadow-xl">
          <CardContent className="p-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <p className="text-lg font-medium text-slate-700">
              {alreadyEvaluated ? 'Avaliação já registrada' : 'Avaliação enviada com sucesso!'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {alreadyEvaluated
                ? 'Este treinamento já foi avaliado. Agradecemos sua participação!'
                : 'Recebemos sua avaliação. Agradecemos seu feedback!'}
            </p>
            {alreadyEvaluated && avalData?.nota && (
              <div className="flex items-center gap-1 mt-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-6 w-6',
                      i < avalData.nota ? 'fill-amber-400 text-amber-400' : 'text-slate-300',
                    )}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PageShell>
    )

  const trainingTitle =
    avalData?.treinamento_motivo ||
    (avalData?.modulos_novos && Array.isArray(avalData.modulos_novos)
      ? avalData.modulos_novos.join(', ')
      : 'Treinamento')

  return (
    <PageShell>
      <Card className="shadow-xl border-slate-200/80">
        <CardContent className="p-6 sm:p-8">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="h-5 w-5 text-violet-600" />
              <h1 className="text-lg font-bold text-slate-800">Avaliação do Treinamento</h1>
            </div>
            <p className="text-sm text-slate-500">
              {avalData?.cliente_nome || 'Cliente'} — {trainingTitle}
            </p>
          </div>

          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-violet-50 border border-violet-100">
              <p className="text-sm text-violet-800 font-medium">
                Como foi sua experiência com o treinamento?
              </p>
              <p className="text-xs text-violet-600 mt-1">
                Sua avaliação nos ajuda a melhorar continuamente nossos serviços.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Sua nota *</Label>
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => {
                  const starValue = i + 1
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={cn(
                          'h-9 w-9 transition-colors',
                          starValue <= (hoverRating || rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300',
                        )}
                      />
                    </button>
                  )
                })}
                {rating > 0 && (
                  <span className="ml-2 text-sm font-medium text-slate-600">{rating} de 5</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comentarios">Comentários e Sugestões</Label>
              <Textarea
                id="comentarios"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Deixe seu feedback sobre o treinamento..."
                rows={5}
              />
            </div>

            {submitError && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{submitError}</p>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
              className="w-full bg-violet-600 hover:bg-violet-700"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1.5" />
              )}
              {submitting ? 'Enviando...' : 'Enviar Avaliação'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  )
}
