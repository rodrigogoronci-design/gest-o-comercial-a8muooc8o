import { type ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Package,
  Layers,
  Building2,
  Info,
  ShieldCheck,
  CheckCircle,
  Clock,
  Lock,
} from 'lucide-react'
import { parseModulosToList } from '@/lib/modules-parser'
import {
  parseItemsSafe,
  getContractedModules,
  getRelatedStagesForModule,
  computeScopeIndicator,
} from '@/lib/scope-mapping'

interface ContractedPlanDetailsProps {
  proposta: any | null
  cliente: any | null
  etapas?: any[] | null
  redactFinancial?: boolean
  dadosParametrizacao?: any | null
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
}: ContractedPlanDetailsProps) {
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

  const planDescription =
    dadosParametrizacao?.plano_descricao ||
    cliente?.planos_saude?.descricao ||
    'Plano não identificado'
  const planCode = dadosParametrizacao?.plano_codigo || cliente?.planos_saude?.codigo || null
  const modoImplantacao = cliente?.modo_implantacao
  const safeItems = parseItemsSafe(proposta?.itens)
  const modulos = parseModulosToList(cliente?.modulos)
  const allModules = getContractedModules(cliente, proposta)

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
          <Badge
            variant="secondary"
            className="ml-auto text-xs bg-emerald-50 text-emerald-700 border-emerald-200"
          >
            <ShieldCheck className="h-3 w-3 mr-1" />
            Somente leitura
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
          <InfoRow icon={Package} label="Plano" value={planDescription} />
          {planCode && <InfoRow icon={Building2} label="Código do Plano" value={planCode} />}
          <InfoRow
            icon={Building2}
            label="Modo de Implantação"
            value={modoImplantacao ? capitalize(modoImplantacao) : null}
          />
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

        {modulos.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">Módulos Contratados</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {modulos.map((mod, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="bg-indigo-50 text-indigo-700 border-indigo-200"
                  >
                    {mod}
                  </Badge>
                ))}
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
                      <span className="font-medium">{f.nome || f.name || `Filial ${i + 1}`}</span>
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
                  if (related.length === 0) return null
                  return (
                    <div key={mod} className="rounded-lg border border-slate-100 p-2.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge
                          variant="outline"
                          className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs"
                        >
                          {mod}
                        </Badge>
                        <span className="text-xs text-slate-400">{related.length} etapa(s)</span>
                      </div>
                      <div className="space-y-1 pl-1">
                        {related.map((e) => (
                          <div key={e.id} className="flex items-center justify-between gap-2">
                            <span className="text-xs text-slate-600">{e.titulo}</span>
                            <StageStatusBadge status={e.status} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
