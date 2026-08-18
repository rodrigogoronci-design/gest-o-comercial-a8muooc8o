import { useState, useEffect, useMemo, type ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Package,
  Layers,
  Building2,
  Info,
  ShieldCheck,
  CheckCircle,
  Clock,
  Lock,
  Pencil,
  Save,
  X,
  Loader2,
  Plus,
} from 'lucide-react'
import { parseModulosToList } from '@/lib/modules-parser'
import {
  parseItemsSafe,
  getRelatedStagesForModule,
  computeScopeIndicator,
} from '@/lib/scope-mapping'
import { usePlanFallback } from '@/hooks/use-plan-fallback'
import { getContractedModulesWithBasic, BASIC_MODULE_NAMES } from '@/lib/plan-modules'
import { fetchPlanosErp, type PlanoErp } from '@/services/planos'
import { updatePlanoImplementacao } from '@/services/implementacoes'
import { toast } from 'sonner'

interface ContractedPlanDetailsProps {
  proposta: any | null
  cliente: any | null
  etapas?: any[] | null
  redactFinancial?: boolean
  dadosParametrizacao?: any | null
  implementacaoId?: string | null
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: ReactNode }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-start gap-2 py-1.5">
      <Icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-xs text-slate-500">{label}</span>
        <div className="text-sm font-medium text-slate-800">{value}</div>
      </div>
    </div>
  )
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function StageStatusBadge({ status }: { status: string }) {
  if (status === 'Concluída') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
        <CheckCircle className="h-3 w-3" /> Concluída
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
      <Clock className="h-3 w-3" /> {status}
    </span>
  )
}

export function ContractedPlanDetails({
  proposta,
  cliente,
  etapas,
  redactFinancial = false,
  dadosParametrizacao,
  implementacaoId,
}: ContractedPlanDetailsProps) {
  const {
    planDescription,
    planCode,
    isLoading: isPlanLoading,
  } = usePlanFallback(implementacaoId, dadosParametrizacao, cliente, proposta)

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [erpPlanos, setErpPlanos] = useState<PlanoErp[]>([])

  // Campos editáveis
  const [editPlanoId, setEditPlanoId] = useState<string>('')
  const [editDescricao, setEditDescricao] = useState<string>('')
  const [editCodigo, setEditCodigo] = useState<string>('')
  const [editFranquia, setEditFranquia] = useState<string>('')
  const [editModo, setEditModo] = useState<string>('')
  const [editModulos, setEditModulos] = useState<string[]>([])

  // Carrega planos do ERP para o select
  useEffect(() => {
    if (!editing) return
    fetchPlanosErp()
      .then((p) => setErpPlanos(p))
      .catch(() => {})
  }, [editing])

  // Inicializa os campos editáveis ao abrir edição
  useEffect(() => {
    if (!editing) return
    setEditPlanoId(dadosParametrizacao?.plano_id || '')
    setEditDescricao(planDescription !== 'Plano não identificado' ? planDescription : '')
    setEditCodigo(planCode || '')
    setEditFranquia(
      dadosParametrizacao?.franquia_quantidade != null
        ? String(dadosParametrizacao.franquia_quantidade)
        : '',
    )
    setEditModo(dadosParametrizacao?.modo_implantacao || cliente?.modo_implantacao || '')
    setEditModulos(
      Array.isArray(dadosParametrizacao?.modulos_copiados) &&
        dadosParametrizacao.modulos_copiados.length > 0
        ? dadosParametrizacao.modulos_copiados
        : getContractedModulesWithBasic(cliente),
    )
  }, [editing, dadosParametrizacao, planDescription, planCode, cliente])

  const planDisplay =
    Boolean(planDescription) && planDescription !== 'Plano não identificado'
      ? planCode && !planDescription.toLowerCase().includes(planCode.toLowerCase())
        ? `${planCode} - ${planDescription}`
        : planDescription
      : 'Plano não identificado'

  const handleSelectPlano = (planoId: string) => {
    setEditPlanoId(planoId)
    const found = erpPlanos.find((p) => p.id === planoId)
    if (found) {
      setEditDescricao(found.descricao)
      setEditCodigo(found.codigo)
      if (found.franquia_quantidade != null) setEditFranquia(String(found.franquia_quantidade))
    }
  }

  const handleSave = async () => {
    if (!implementacaoId) {
      toast.error('Implementação não identificada.')
      return
    }
    setSaving(true)
    try {
      // Garante que o módulo básico esteja sempre presente
      const basicSet = new Set(BASIC_MODULE_NAMES.map((n) => n.toLowerCase()))
      const missing = BASIC_MODULE_NAMES.filter(
        (n) => !editModulos.some((m) => String(m).toLowerCase() === n.toLowerCase()),
      )
      const finalModulos = [...missing, ...editModulos]
      void basicSet

      await updatePlanoImplementacao(implementacaoId, {
        plano_id: editPlanoId || null,
        plano_descricao: editDescricao || null,
        plano_codigo: editCodigo || null,
        franquia_quantidade: editFranquia ? Number(editFranquia) : null,
        modo_implantacao: editModo || null,
        modulos_copiados: finalModulos,
      })
      toast.success('Plano da implementação atualizado com sucesso!')
      setEditing(false)
    } catch (err: any) {
      toast.error('Erro ao salvar plano: ' + (err.message || ''))
    } finally {
      setSaving(false)
    }
  }

  // Módulos contratados SEMPRE incluindo o módulo básico do plano
  const allModules = useMemo(() => {
    const fromParam = Array.isArray(dadosParametrizacao?.modulos_copiados)
      ? dadosParametrizacao.modulos_copiados
      : null
    if (fromParam && fromParam.length > 0) {
      // Garante que o básico esteja presente mesmo em dados antigos
      const missing = BASIC_MODULE_NAMES.filter(
        (n) => !fromParam.some((m) => String(m).toLowerCase() === n.toLowerCase()),
      )
      return [...missing, ...fromParam]
    }
    return getContractedModulesWithBasic(cliente)
  }, [dadosParametrizacao, cliente])

  const modulosForDisplay = useMemo(() => allModules, [allModules])

  if (!proposta && !cliente) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-5 w-5 text-indigo-600" />
            Escopo Contratado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Info className="h-4 w-4" />
            Não há detalhes de plano contratado disponíveis para esta implementação.
          </div>
        </CardContent>
      </Card>
    )
  }

  const modoImplantacao = cliente?.modo_implantacao
  const safeItems = parseItemsSafe(proposta?.itens)
  const modulos = parseModulosToList(cliente?.modulos)

  let filiais: any[] = []
  const filiaisRaw = proposta?.filiais_detalhes || cliente?.filiais_detalhes
  if (Array.isArray(filiaisRaw)) {
    filiais = filiaisRaw
  } else if (typeof filiaisRaw === 'string') {
    try {
      filiais = JSON.parse(filiaisRaw)
    } catch {
      /* ignore */
    }
  }
  const quantidadeFiliais = proposta?.quantidade_filiais || cliente?.quantidade_filiais || 0
  const cobrarFiliais = proposta?.cobrar_filiais ?? cliente?.cobrar_filiais ?? false
  const indicator = etapas ? computeScopeIndicator(cliente, proposta, etapas) : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-5 w-5 text-indigo-600" />
          Escopo Contratado
          {editing ? (
            <div className="ml-auto flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                <X className="h-3.5 w-3.5 mr-1" /> Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-1" />
                )}
                Salvar
              </Button>
            </div>
          ) : (
            <Badge
              variant="secondary"
              className="ml-auto text-xs bg-emerald-50 text-emerald-700 border-emerald-200"
            >
              <ShieldCheck className="h-3 w-3 mr-1" />
              {implementacaoId ? 'Editável' : 'Somente leitura'}
            </Badge>
          )}
          {!editing && implementacaoId && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-slate-500 hover:text-indigo-600"
              onClick={() => setEditing(true)}
              title="Editar plano"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Plano (ERP)</Label>
                <Select value={editPlanoId} onValueChange={handleSelectPlano}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o plano..." />
                  </SelectTrigger>
                  <SelectContent>
                    {erpPlanos
                      .filter((p) => p.tipo === 'plano_base')
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.descricao} {p.codigo ? `(${p.codigo})` : ''}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Descrição do Plano</Label>
                <Input
                  value={editDescricao}
                  onChange={(e) => setEditDescricao(e.target.value)}
                  placeholder="Ex: TMS-300"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Código do Plano</Label>
                <Input
                  value={editCodigo}
                  onChange={(e) => setEditCodigo(e.target.value)}
                  placeholder="Ex: ERP-TMS-300"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Franquia / Quantidade</Label>
                <Input
                  type="number"
                  value={editFranquia}
                  onChange={(e) => setEditFranquia(e.target.value)}
                  placeholder="Ex: 300"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Modo de Implantação</Label>
                <Select value={editModo} onValueChange={setEditModo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remoto">Remoto</SelectItem>
                    <SelectItem value="presencial">Presencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700">
                  Módulos do Plano (módulo básico sempre incluso)
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModulos((p) => [...p, ''])}
                >
                  <Plus className="h-3 w-3 mr-1" /> Adicionar
                </Button>
              </div>
              <div className="space-y-2">
                {BASIC_MODULE_NAMES.map((b) => (
                  <div
                    key={b}
                    className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded px-2 py-1"
                  >
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                    <span className="font-medium">{b}</span>
                    <span className="ml-auto">módulo básico (incluso)</span>
                  </div>
                ))}
                {editModulos
                  .filter((m) => !BASIC_MODULE_NAMES.includes(m))
                  .map((mod, i) => (
                    <div key={`extra-${i}`} className="flex items-center gap-2">
                      <Input
                        value={mod}
                        onChange={(e) =>
                          setEditModulos((p) =>
                            p.map((m, idx) => (idx === p.indexOf(mod) ? e.target.value : m)),
                          )
                        }
                        placeholder="Nome do módulo adicional"
                        className="h-8 text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-8 w-8 text-red-500 hover:text-red-700"
                        onClick={() =>
                          setEditModulos((p) => p.filter((_, idx) => idx !== p.indexOf(mod)))
                        }
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              As alterações são salvas em <code>dados_parametrizacao</code> da implementação e
              persistidas no Supabase.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
              {isPlanLoading ? (
                <div className="flex items-start gap-2 py-1.5 col-span-1">
                  <Package className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <span className="text-xs text-slate-500">Buscando plano contratado...</span>
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              ) : (
                <>
                  <InfoRow icon={Package} label="Plano" value={planDisplay} />
                  {planCode && !planDescription?.toLowerCase().includes(planCode.toLowerCase()) && (
                    <InfoRow icon={Building2} label="Código do Plano" value={planCode} />
                  )}
                </>
              )}
              <InfoRow
                icon={Building2}
                label="Modo de Implantação"
                value={modoImplantacao ? capitalize(modoImplantacao) : null}
              />
              {dadosParametrizacao?.franquia_quantidade != null && (
                <InfoRow
                  icon={Layers}
                  label="Franquia"
                  value={dadosParametrizacao.franquia_quantidade}
                />
              )}
            </div>

            {safeItems.length > 0 && !redactFinancial && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700">Itens Inclusos</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {safeItems.map((item, i) => (
                      <Badge key={i} variant="outline" className="bg-slate-50">
                        {item.nome}
                        {item.quantidade !== 1 && item.quantidade !== '1' && (
                          <span className="ml-1 text-slate-400">×{item.quantidade}</span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {redactFinancial && (
              <>
                <Separator />
                <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-amber-50 border border-amber-200">
                  <Lock className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="text-xs text-amber-700 font-medium">
                    Dados financeiros e comerciais restritos para este perfil de acesso.
                  </span>
                </div>
              </>
            )}

            {modulosForDisplay.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700">
                      Módulos Contratados
                    </span>
                    <span className="text-xs text-slate-400">(módulo básico sempre incluso)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {modulosForDisplay.map((mod, i) => {
                      const isBasic = BASIC_MODULE_NAMES.some(
                        (b) => b.toLowerCase() === String(mod).toLowerCase(),
                      )
                      return (
                        <Badge
                          key={i}
                          variant="outline"
                          className={
                            isBasic
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }
                        >
                          {mod}
                          {isBasic && (
                            <span className="ml-1 text-[10px] text-emerald-500">básico</span>
                          )}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            {cobrarFiliais && quantidadeFiliais > 0 && !redactFinancial && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700">
                      Filiais ({quantidadeFiliais})
                    </span>
                  </div>
                  {filiais.length > 0 ? (
                    <div className="space-y-1">
                      {filiais.map((f: any, i: number) => (
                        <div key={i} className="text-sm text-slate-600 flex items-center gap-2">
                          <span className="font-medium">
                            {f.nome || f.name || `Filial ${i + 1}`}
                          </span>
                          {f.cnpj && <span className="text-slate-400">— {f.cnpj}</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      {quantidadeFiliais} filial(is) cadastrada(s).
                    </p>
                  )}
                </div>
              </>
            )}

            {etapas && etapas.length > 0 && allModules.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700">
                      Mapeamento de Escopo para Etapas
                    </span>
                  </div>
                  {indicator && (
                    <p className="text-xs text-slate-500 mb-3">
                      {indicator.relatedStagesCount} de {indicator.totalStages} etapas vinculadas ao
                      escopo contratado • {indicator.completedRelatedStages} concluídas
                    </p>
                  )}
                  <div className="space-y-2">
                    {allModules.map((mod) => {
                      const related = getRelatedStagesForModule(mod, etapas)
                      return (
                        <div key={mod} className="rounded-lg border border-slate-100 p-2.5">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Badge
                              variant="outline"
                              className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs"
                            >
                              {mod}
                            </Badge>
                            <span className="text-xs text-slate-400">
                              {related.length > 0
                                ? `${related.length} etapa(s)`
                                : 'Nenhuma etapa vinculada'}
                            </span>
                          </div>
                          <div className="space-y-1 pl-1">
                            {related.length > 0 ? (
                              related.map((e) => (
                                <div key={e.id} className="flex items-center justify-between gap-2">
                                  <span className="text-xs text-slate-600">{e.titulo}</span>
                                  <StageStatusBadge status={e.status} />
                                </div>
                              ))
                            ) : (
                              <span className="text-xs italic text-slate-400">
                                Nenhuma etapa vinculada
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
