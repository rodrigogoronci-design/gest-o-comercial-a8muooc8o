import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Loader2,
  Printer,
  FileText,
  Building2,
  Calendar,
  CreditCard,
  Package,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  UserRound,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getClientesParaRelatorioIndividual,
  getClienteRelatorioDetalhado,
  type ClienteRelatorioDetalhado,
} from '@/services/relatorio-clientes'
import { formatCurrency, formatCNPJ, formatDate } from '@/lib/formatters'
import logoUrl from '@/assets/logomarca-service-ea011.png'

const MODULE_DESCRIPTIONS: Record<string, string> = {
  administração:
    'Centraliza todas as configurações do sistema, incluindo usuários, permissões de acesso, parâmetros dos módulos, e-mails automáticos e configurações gerais.',
  básico:
    'Responsável pelos cadastros principais da empresa, como matriz, filiais, clientes, fornecedores, motoristas, veículos e demais informações utilizadas pelos outros módulos.',
  'básico (cadastros)':
    'Responsável pelos cadastros principais da empresa, como matriz, filiais, clientes, fornecedores, motoristas, veículos e demais informações utilizadas pelos outros módulos.',
  carga:
    'Gerencia toda a operação de transporte, permitindo emissão de CT-e, MDF-e, NFS-e, CIOT, averbação de seguro, tabela de frete, importação de XML, controle de entregas e demais documentos fiscais do transporte.',
  'carga (transporte)':
    'Gerencia toda a operação de transporte, permitindo emissão de CT-e, MDF-e, NFS-e, CIOT, averbação de seguro, tabela de frete, importação de XML, controle de entregas e demais documentos fiscais do transporte.',
  comercial:
    'Controla o processo comercial desde a criação das propostas até sua aprovação, com envio automático em PDF para os clientes.',
  faturamento:
    'Automatiza o faturamento das viagens através dos CT-es e NFS-es emitidos, permitindo geração de faturas, boletos e aplicação de regras de cobrança.',
  financeiro:
    'Realiza a gestão financeira completa da transportadora, com contas a pagar e receber, fluxo de caixa, conciliação bancária, boletos, orçamento, DRE e relatórios financeiros.',
  fiscal:
    'Auxilia no cumprimento das obrigações fiscais através da geração de SPED, Sintegra, livros fiscais, emissão de NF-e, apuração de impostos e importação de notas fiscais.',
  edi: 'Integra o TMS com embarcadores, bancos, seguradoras, sistemas contábeis, abastecimento e órgãos fiscais, automatizando a troca de informações e reduzindo retrabalho.',
  'edi (integrações)':
    'Integra o TMS com embarcadores, bancos, seguradoras, sistemas contábeis, abastecimento e órgãos fiscais, automatizando a troca de informações e reduzindo retrabalho.',
  frota:
    'Gerencia toda a frota da empresa, incluindo compras, estoque, abastecimento, manutenção, pneus e controle de vencimentos de documentos e licenças dos veículos.',
  'controle de viagem':
    'Faz o acompanhamento completo das viagens da frota própria, registrando despesas, adiantamentos, abastecimentos, prestação de contas, comprovantes de entrega e resultado financeiro da viagem.',
  'container / bloco':
    'Desenvolvido para operações portuárias e de importação/exportação, controlando coletas, entregas, programação de transporte e emissão dos documentos necessários.',
  fracionado:
    'Gerencia operações com cargas fracionadas, acompanhando toda a movimentação da mercadoria desde a coleta até a entrega ao destinatário.',
  calendário:
    'Permite configurar alertas automáticos para vencimentos e compromissos operacionais ou financeiros importantes.',
  'painel de informações':
    'Possibilita a criação de relatórios e planilhas personalizadas diretamente a partir dos dados armazenados no sistema.',
  patrimônio:
    'Controla os bens da empresa, registrando aquisições, movimentações, depreciação e gerando relatórios patrimoniais.',
}

function getModuleDescription(moduleName: string): string | null {
  const normalized = moduleName.toLowerCase().trim()
  if (MODULE_DESCRIPTIONS[normalized]) return MODULE_DESCRIPTIONS[normalized]
  for (const key of Object.keys(MODULE_DESCRIPTIONS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return MODULE_DESCRIPTIONS[key]
    }
  }
  return null
}

function formatDateBR(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const [year, month, day] = datePart.split('-')
    return `${day}/${month}/${year}`
  }
  return dateString
}

function parseModulosData(clienteData: ClienteRelatorioDetalhado | null): {
  plano_base: string | null
  adicionais: string[]
} {
  let plano_base: string | null = null
  let adicionais: string[] = []

  if (!clienteData || !clienteData.modulos) return { plano_base, adicionais }

  const modulos = clienteData.modulos

  const extractName = (m: any): string | null => {
    if (typeof m === 'string') return m.trim() || null
    if (typeof m === 'number') return String(m)
    if (typeof m === 'object' && m !== null) {
      if (m.selected === false || m.ativo === false || m.active === false) {
        return null
      }
      return m.nome || m.name || m.label || m.descricao || m.titulo || null
    }
    return null
  }

  let parsed = modulos
  if (typeof modulos === 'string') {
    try {
      parsed = JSON.parse(modulos)
    } catch {
      adicionais = modulos
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
      return { plano_base, adicionais }
    }
  }

  if (Array.isArray(parsed)) {
    adicionais = parsed.map(extractName).filter((s): s is string => Boolean(s))
  } else if (typeof parsed === 'object' && parsed !== null) {
    const objKeys = Object.keys(parsed)
    const hasBooleanVals = objKeys.some((k) => typeof (parsed as any)[k] === 'boolean')

    if (hasBooleanVals && !parsed.plano_base && !Array.isArray(parsed.adicionais)) {
      adicionais = objKeys
        .filter((k) => (parsed as any)[k] === true)
        .map((k) => k.trim())
        .filter(Boolean)
    } else {
      plano_base = parsed.plano_base || null
      if (Array.isArray(parsed.adicionais)) {
        adicionais = parsed.adicionais.map(extractName).filter((s): s is string => Boolean(s))
      }
    }

    const filiaisDet = parsed.filiais_detalhes || clienteData.filiais_detalhes || []
    if (Array.isArray(filiaisDet)) {
      filiaisDet.forEach((f: any) => {
        if (f.nome && f.cnpj) {
          const cnpjf = formatCNPJ(f.cnpj)
          const filialName = `Filial: ${f.nome} (${cnpjf})`
          const dfeName = `DF-e (Filial: ${f.nome})`
          if (!adicionais.includes(filialName)) adicionais.push(filialName)
          if (f.dfe_incluso && !adicionais.includes(dfeName)) adicionais.push(dfeName)
        }
      })
    }
  }

  return { plano_base, adicionais }
}

export function ClientIndividualReport() {
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [clienteData, setClienteData] = useState<ClienteRelatorioDetalhado | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingData, setLoadingData] = useState(false)

  const loadClientes = useCallback(async () => {
    setLoadingList(true)
    try {
      const data = await getClientesParaRelatorioIndividual()
      setClientes(data)
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id)
      }
    } catch (error: any) {
      toast.error('Erro ao carregar lista de clientes: ' + (error.message || ''))
    } finally {
      setLoadingList(false)
    }
  }, [selectedId])

  useEffect(() => {
    loadClientes()
  }, [loadClientes])

  const loadClienteData = useCallback(async (id: string) => {
    if (!id) return
    setLoadingData(true)
    try {
      const data = await getClienteRelatorioDetalhado(id)
      setClienteData(data)
    } catch (error: any) {
      toast.error('Erro ao carregar dados do cliente: ' + (error.message || ''))
      setClienteData(null)
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    if (selectedId) {
      loadClienteData(selectedId)
    }
  }, [selectedId, loadClienteData])

  const modulosData = useMemo(() => {
    if (!clienteData) return { plano_base: null, adicionais: [] }
    return parseModulosData(clienteData)
  }, [clienteData])

  const modulosList = modulosData.adicionais
  const planoFranquia = modulosData.plano_base || clienteData?.plano_descricao || 'Não contratado'

  const handlePrint = () => {
    if (!clienteData) {
      toast.warning('Selecione um cliente para imprimir o relatório.')
      return
    }
    window.print()
  }

  const valorMensalidade = clienteData?.valor_total ?? 0

  return (
    <div className="space-y-4">
      <Card className="shadow-sm print-card">
        <CardHeader className="no-print">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-[#1b4382]" />
                Relatório Individual de Cliente
              </CardTitle>
              <CardDescription className="mt-1">
                Selecione um cliente para visualizar o relatório detalhado com informações
                contratuais.
              </CardDescription>
            </div>
            <Button
              onClick={handlePrint}
              disabled={!clienteData || loadingData}
              variant="default"
              className="bg-[#1b4382] hover:bg-[#1b4382]/90 no-print"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir Relatório
            </Button>
          </div>
          <div className="mt-3 no-print">
            {loadingList ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando clientes...
              </div>
            ) : clientes.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum cliente cadastrado.</p>
            ) : (
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="w-full sm:w-[400px]">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="flex items-center justify-center py-16 no-print">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              <span className="ml-2 text-sm text-slate-500">Carregando dados do cliente...</span>
            </div>
          ) : !clienteData ? (
            <div className="flex flex-col items-center justify-center py-16 text-center no-print">
              <div className="rounded-full bg-slate-100 p-4 mb-4">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-base font-medium text-slate-600">Nenhum cliente selecionado</p>
              <p className="text-sm text-slate-400 mt-1">
                Selecione um cliente acima para visualizar o relatório individual.
              </p>
            </div>
          ) : (
            <div className="report-document space-y-6">
              <div className="report-header flex items-center justify-between border-b-2 border-[#1b4382] pb-4">
                <div className="flex items-center gap-4">
                  <img
                    src={logoUrl}
                    alt="Service Logic"
                    className="h-12 w-auto object-contain print:h-14"
                  />
                  <div className="border-l-2 border-[#f37021] pl-4">
                    <h2 className="text-xl font-bold text-[#1b4382] print:text-black">
                      Relatório de Contrato
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Documento gerado em {formatDate(new Date().toISOString())}
                    </p>
                  </div>
                </div>
                <Building2 className="h-10 w-10 text-[#1b4382] no-print" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Razão Social
                  </p>
                  <p className="text-sm font-medium text-slate-800">{clienteData.nome}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    CNPJ
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {clienteData.cnpj ? formatCNPJ(clienteData.cnpj) : '—'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Data de Assinatura
                  </p>
                  <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {formatDateBR(clienteData.data_assinatura)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Status
                  </p>
                  <Badge
                    variant={
                      clienteData.status === 'Inativo' || clienteData.status === 'Cancelado'
                        ? 'destructive'
                        : 'secondary'
                    }
                    className={
                      clienteData.status === 'Inativo' || clienteData.status === 'Cancelado'
                        ? 'bg-red-100 text-red-700 hover:bg-red-100'
                        : 'bg-green-100 text-green-700 hover:bg-green-100'
                    }
                  >
                    {clienteData.status ?? 'Ativo'}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Plano Atual de Franquia
                  </p>
                  <div className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                    {planoFranquia !== 'Não contratado' ? (
                      <Badge
                        variant="outline"
                        className="bg-indigo-50 text-indigo-700 border-indigo-100 font-medium uppercase"
                      >
                        {planoFranquia}
                      </Badge>
                    ) : (
                      <span className="text-slate-500 italic">Não contratado</span>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Valor da Mensalidade
                  </p>
                  <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                    {valorMensalidade > 0 ? formatCurrency(valorMensalidade) : '—'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Data de Vencimento
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {clienteData.vencimento_mensal != null
                      ? `${clienteData.vencimento_mensal}º dia do mês`
                      : 'Não definido'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Valor de Implantação
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {clienteData.valor_implantacao != null && clienteData.valor_implantacao > 0
                      ? formatCurrency(clienteData.valor_implantacao)
                      : 'Não informado'}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5" />
                  Módulos Contratados
                </p>
                {modulosList.length > 0 ? (
                  <div className="flex flex-wrap gap-2 print:gap-1.5">
                    {modulosList.map((modulo, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="bg-slate-100 text-slate-700 border-slate-200 font-normal px-3 py-1 print:border-slate-300"
                      >
                        {modulo}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">
                    Não contratado / Nenhum selecionado
                  </p>
                )}
              </div>

              {modulosList.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Descrição dos Módulos
                    </p>
                    <div className="space-y-2.5">
                      {modulosList.map((modulo, idx) => {
                        const description = getModuleDescription(modulo)
                        return (
                          <div
                            key={idx}
                            className="module-desc-item rounded-lg border border-slate-200 bg-slate-50/50 p-3 print:border-slate-300 print:bg-transparent"
                          >
                            <p className="text-sm font-semibold text-[#1b4382] print:text-black">
                              {modulo}
                            </p>
                            {description ? (
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed print:text-black">
                                {description}
                              </p>
                            ) : (
                              <p className="text-xs text-slate-400 mt-1 italic">
                                Módulo contratado sem descrição detalhada.
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1">
                    <Mail className="h-3 w-3" /> E-mail
                  </p>
                  <p className="text-sm font-medium text-slate-800">{clienteData.email ?? '—'}</p>
                </div>{' '}
              </div>

              {clienteData.quantidade_filiais != null && clienteData.quantidade_filiais > 0 && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Filiais
                    </p>
                    <p className="text-sm font-medium text-slate-800">
                      {clienteData.quantidade_filiais} filial(is) — Modo de implantação:{' '}
                      {clienteData.modo_implantacao ?? '—'}
                    </p>
                  </div>
                </>
              )}

              <div className="report-footer border-t border-slate-200 pt-4 mt-6">
                <p className="text-xs text-slate-400 text-center">
                  Documento gerado pelo sistema de Gestão Comercial •{' '}
                  {formatDate(new Date().toISOString())}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
