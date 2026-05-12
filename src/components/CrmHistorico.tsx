import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { MessageSquare, Phone, Mail, Calendar, Plus, Trash2, Loader2 } from 'lucide-react'

type Historico = {
  id: string
  prospect_id: string
  data_interacao: string
  tipo_contato: string
  resumo: string
  detalhes: string | null
}

export function CrmHistorico({ prospectId }: { prospectId: string }) {
  const [historico, setHistorico] = useState<Historico[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const [tipoContato, setTipoContato] = useState('Reunião')
  const [resumo, setResumo] = useState('')
  const [detalhes, setDetalhes] = useState('')

  const fetchHistorico = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('crm_historico_interacoes')
      .select('*')
      .eq('prospect_id', prospectId)
      .order('data_interacao', { ascending: false })

    if (!error && data) {
      setHistorico(data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchHistorico()
  }, [prospectId])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resumo) return
    setIsSubmitting(true)
    const { error } = await supabase.from('crm_historico_interacoes').insert([
      {
        prospect_id: prospectId,
        tipo_contato: tipoContato,
        resumo,
        detalhes: detalhes || null,
      },
    ])

    if (!error) {
      await supabase
        .from('crm_prospects')
        .update({ ultima_interacao: new Date().toISOString() })
        .eq('id', prospectId)
    }

    setIsSubmitting(false)

    if (error) {
      return toast({
        title: 'Erro ao registrar',
        description: error.message,
        variant: 'destructive',
      })
    }

    toast({ title: 'Sucesso', description: 'Interação registrada com sucesso!' })
    setResumo('')
    setDetalhes('')
    fetchHistorico()
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro de interação?')) return
    const { error } = await supabase.from('crm_historico_interacoes').delete().eq('id', id)
    if (error) {
      return toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
    }
    fetchHistorico()
  }

  const getIcon = (tipo: string) => {
    if (tipo === 'Telefone' || tipo === 'WhatsApp') return <Phone className="h-4 w-4" />
    if (tipo === 'E-mail') return <Mail className="h-4 w-4" />
    if (tipo === 'Reunião') return <Calendar className="h-4 w-4" />
    return <MessageSquare className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={onSubmit}
        className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-100"
      >
        <h3 className="font-semibold text-slate-800 text-sm">Registrar Nova Interação</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <Select value={tipoContato} onValueChange={setTipoContato}>
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Reunião">Reunião</SelectItem>
                <SelectItem value="Telefone">Telefone</SelectItem>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                <SelectItem value="E-mail">E-mail</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Input
              placeholder="Resumo (ex: Proposta enviada, Ligação de prospecção)"
              value={resumo}
              onChange={(e) => setResumo(e.target.value)}
              required
              className="bg-white"
            />
          </div>
        </div>
        <Textarea
          placeholder="Detalhes adicionais da conversa..."
          value={detalhes}
          onChange={(e) => setDetalhes(e.target.value)}
          className="min-h-[80px] bg-white"
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !resumo} className="gap-2">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Registrar Interação
          </Button>
        </div>
      </form>

      <div className="space-y-3">
        <h3 className="font-semibold text-slate-800 text-sm">Histórico de Acompanhamentos</h3>

        {isLoading ? (
          <div className="py-8 flex justify-center items-center">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        ) : historico.length === 0 ? (
          <div className="bg-white p-6 rounded-lg border border-dashed border-slate-200 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma interação registrada para este lead.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {historico.map((h) => (
              <div key={h.id} className="bg-white p-4 rounded-lg border shadow-sm group">
                <div className="flex gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-500 shrink-0">
                    {getIcon(h.tipo_contato)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-slate-800">{h.resumo}</h4>
                        <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 mt-0.5 mb-2">
                          <span>{h.tipo_contato}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500">
                            {new Date(h.data_interacao).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(h.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md"
                        title="Excluir interação"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {h.detalhes && (
                      <p className="text-sm text-slate-600 whitespace-pre-wrap mt-1">
                        {h.detalhes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
