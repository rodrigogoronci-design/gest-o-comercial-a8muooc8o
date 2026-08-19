import { useEffect, useState } from 'react'
import { Save, Loader2, FileDown, Clock, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { updateConsultoria, type ConsultoriaProject } from '@/services/consultoria-crm'
import { openHandoverPdf } from '@/lib/handover-pdf'

interface Props {
  project: ConsultoriaProject
  currentUserEmail?: string | null
  /** Chamado após salvar com sucesso para o pai atualizar o estado do projeto. */
  onSaved?: (patch: Partial<ConsultoriaProject>) => void
}

/**
 * Seção "Handover Comercial → Execução" dentro do cadastro da consultoria.
 *
 * - Campo de texto extenso (markdown simples) salvo no Supabase.
 * - Histórico: "Última atualização: [data] por [usuário]".
 * - Botão "Gerar PDF" que abre nova aba com documento A4 formatado.
 */
export function ConsultoriaHandoverSection({ project, currentUserEmail, onSaved }: Props) {
  const [handover, setHandover] = useState(project.handover_comercial || '')
  const [respComercial, setRespComercial] = useState('')
  const [respExecucao, setRespExecucao] = useState('')
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Atualiza o conteúdo local quando o projeto é recarregado.
  useEffect(() => {
    setHandover(project.handover_comercial || '')
  }, [project.handover_comercial])

  const ultimaAtualizacao = project.handover_atualizado_em
  const atualizadoPor = project.handover_atualizado_por

  const handleSave = async () => {
    setSaving(true)
    try {
      const agora = new Date().toISOString()
      const por = currentUserEmail || 'Usuário'
      await updateConsultoria(project.id, {
        handover_comercial: handover,
        handover_atualizado_em: agora,
        handover_atualizado_por: por,
      })
      // Avisa o pai para atualizar o estado do projeto (histórico reflete imediatamente).
      onSaved?.({
        handover_comercial: handover,
        handover_atualizado_em: agora,
        handover_atualizado_por: por,
      })
      toast.success('Handover comercial salvo com sucesso!')
    } catch (error: any) {
      toast.error('Erro ao salvar handover: ' + (error.message || ''))
    } finally {
      setSaving(false)
    }
  }

  const handleGeneratePdf = async () => {
    setGenerating(true)
    try {
      openHandoverPdf({
        cliente: project.clientes?.nome || 'N/A',
        projeto: `Service Logic | ${project.clientes?.nome || 'N/A'}`,
        responsavelComercial: respComercial,
        responsavelExecucao: respExecucao,
        status: project.status,
        conteudo: handover,
      })
    } catch (error: any) {
      toast.error(error.message || 'Erro ao gerar PDF')
    } finally {
      setGenerating(false)
    }
  }

  const formatarDataHora = (iso: string | null) => {
    if (!iso) return null
    try {
      const d = new Date(iso)
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Handover Comercial &rarr; Execução
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Registre as informações repassadas do Comercial para a equipe de execução da
            consultoria. Suporta títulos com{' '}
            <code className="text-[10px] bg-slate-100 px-1 rounded">#</code>, listas com{' '}
            <code className="text-[10px] bg-slate-100 px-1 rounded">-</code> e negrito com{' '}
            <code className="text-[10px] bg-slate-100 px-1 rounded">**texto**</code>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleGeneratePdf}
            disabled={generating}
            className="border-[#1b4382] text-[#1b4382] hover:bg-[#1b4382] hover:text-white"
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <FileDown className="h-3.5 w-3.5 mr-1" />
            )}
            Gerar PDF
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-600">Responsável Comercial</Label>
          <Input
            placeholder="Nome de quem fechou o projeto"
            value={respComercial}
            onChange={(e) => setRespComercial(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-600">Responsável pela Execução</Label>
          <Input
            placeholder="Nome de quem vai executar a consultoria"
            value={respExecucao}
            onChange={(e) => setRespExecucao(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-slate-600">
          Conteúdo do Handover Comercial (markdown simples)
        </Label>
        <Textarea
          value={handover}
          onChange={(e) => setHandover(e.target.value)}
          rows={16}
          placeholder={`# Objetivo do projeto\nDescreva aqui o objetivo da consultoria...\n\n## Premissas\n- Premissa 1\n- Premissa 2\n\n## Pontos de atenção\n**Risco X:** detalhes do risco...`}
          className="font-mono text-sm leading-relaxed"
        />
      </div>

      <Card className="bg-slate-50/70 border-slate-200">
        <CardContent className="p-3 flex items-center gap-2 text-xs text-slate-600">
          <History className="h-3.5 w-3.5 text-slate-400" />
          {ultimaAtualizacao ? (
            <span>
              Última atualização:{' '}
              <strong className="text-slate-700">{formatarDataHora(ultimaAtualizacao)}</strong>
              {atualizadoPor && (
                <>
                  {' '}
                  por <strong className="text-slate-700">{atualizadoPor}</strong>
                </>
              )}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              Handover ainda não registrado.
            </span>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
