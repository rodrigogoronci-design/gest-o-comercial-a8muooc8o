import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Printer,
  FileText,
  Calendar,
  UserRound,
  CheckCircle2,
  Settings,
  Truck,
  Receipt,
  Package,
  CircleDollarSign,
  Network,
  Route,
  BarChart,
  Box,
  Boxes,
  Building,
  ShieldCheck,
  IdCard,
  Layers,
  Timer,
  Mail,
  Phone,
  Globe,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getClientesParaRelatorioIndividual,
  getClienteRelatorioDetalhado,
  type ClienteRelatorioDetalhado,
} from '@/services/relatorio-clientes'
import { formatCurrency, formatCNPJ, formatDate } from '@/lib/formatters'
import logoUrl from '@/assets/logomarca-service-ea011.png'

const MODULE_INFO: Record<string, { desc: string; icon: any }> = {
  administração: {
    desc: 'Centraliza todas as configurações do sistema, incluindo usuários, permissões de acesso, parâmetros dos módulos, e-mails automáticos e configurações gerais.',
    icon: Settings,
  },
  básico: {
    desc: 'Responsável pelos cadastros principais da empresa, como matriz, filiais, clientes, fornecedores, motoristas, veículos e demais informações utilizadas pelos outros módulos.',
    icon: Package,
  },
  'básico (cadastros)': {
    desc: 'Responsável pelos cadastros principais da empresa, como matriz, filiais, clientes, fornecedores, motoristas, veículos e demais informações utilizadas pelos outros módulos.',
    icon: Package,
  },
  carga: {
    desc: 'Gerencia toda a operação de transporte, permitindo emissão de CT-e, MDF-e, NFS-e, CIOT, averbação de seguro, tabela de frete, importação de XML, controle de entregas e demais documentos fiscais do transporte.',
    icon: Truck,
  },
  'carga (transporte)': {
    desc: 'Gerencia toda a operação de transporte, permitindo emissão de CT-e, MDF-e, NFS-e, CIOT, averbação de seguro, tabela de frete, importação de XML, controle de entregas e demais documentos fiscais do transporte.',
    icon: Truck,
  },
  comercial: {
    desc: 'Controla o processo comercial desde a criação das propostas até sua aprovação, com envio automático em PDF para os clientes.',
    icon: ShieldCheck,
  },
  faturamento: {
    desc: 'Automatiza o faturamento das viagens através dos CT-es e NFS-es emitidos, permitindo geração de faturas, boletos e aplicação de regras de cobrança.',
    icon: Receipt,
  },
  financeiro: {
    desc: 'Realiza a gestão financeira completa da transportadora, com contas a pagar e receber, fluxo de caixa, conciliação bancária, boletos, orçamento, DRE e relatórios financeiros.',
    icon: CircleDollarSign,
  },
  fiscal: {
    desc: 'Auxilia no cumprimento das obrigações fiscais através da geração de SPED, Sintegra, livros fiscais, emissão de NF-e, apuração de impostos e importação de notas fiscais.',
    icon: FileText,
  },
  edi: {
    desc: 'Integra o TMS com embarcadores, bancos, seguradoras, sistemas contábeis, abastecimento e órgãos fiscais, automatizando a troca de informações e reduzindo retrabalho.',
    icon: Network,
  },
  'edi (integrações)': {
    desc: 'Integra o TMS com embarcadores, bancos, seguradoras, sistemas contábeis, abastecimento e órgãos fiscais, automatizando a troca de informações e reduzindo retrabalho.',
    icon: Network,
  },
  frota: {
    desc: 'Gerencia toda a frota da empresa, incluindo compras, estoque, abastecimento, manutenção, pneus e controle de vencimentos de documentos e licenças dos veículos.',
    icon: Truck,
  },
  'controle de viagem': {
    desc: 'Faz o acompanhamento completo das viagens da frota própria, registrando despesas, adiantamentos, abastecimentos, prestação de contas, comprovantes de entrega e resultado financeiro da viagem.',
    icon: Route,
  },
  'container / bloco': {
    desc: 'Desenvolvido para operações portuárias e de importação/exportação, controlando coletas, entregas, programação de transporte e emissão dos documentos necessários.',
    icon: Box,
  },
  fracionado: {
    desc: 'Gerencia operações com cargas fracionadas, acompanhando toda a movimentação da mercadoria desde a coleta até a entrega ao destinatário.',
    icon: Boxes,
  },
  calendário: {
    desc: 'Permite configurar alertas automáticos para vencimentos e compromissos operacionais ou financeiros importantes.',
    icon: Calendar,
  },
  'painel de informações': {
    desc: 'Possibilita a criação de relatórios e planilhas personalizadas diretamente a partir dos dados armazenados no sistema.',
    icon: BarChart,
  },
  patrimônio: {
    desc: 'Controla os bens da empresa, registrando aquisições, movimentações, depreciação e gerando relatórios patrimoniais.',
    icon: Building,
  },
}

function getModuleInfo(moduleName: string) {
  const normalized = moduleName.toLowerCase().trim()
  if (MODULE_INFO[normalized]) return MODULE_INFO[normalized]
  for (const key of Object.keys(MODULE_INFO)) {
    if (normalized.includes(key) || key.includes(normalized)) return MODULE_INFO[key]
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

function parseModulosData(clienteData: ClienteRelatorioDetalhado | null) {
  let plano_base: string | null = null
  let adicionais: string[] = []
  if (!clienteData || !clienteData.modulos) return { plano_base, adicionais }
  const modulos = clienteData.modulos

  const extractName = (m: any): string | null => {
    if (typeof m === 'string') return m.trim() || null
    if (typeof m === 'number') return String(m)
    if (typeof m === 'object' && m !== null) {
      if (m.selected === false || m.ativo === false || m.active === false) return null
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
    if (
      objKeys.some((k) => typeof (parsed as any)[k] === 'boolean') &&
      !parsed.plano_base &&
      !Array.isArray(parsed.adicionais)
    ) {
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
      if (data.length > 0 && !selectedId) setSelectedId(data[0].id)
    } catch (error: any) {
      toast.error('Erro: ' + (error.message || ''))
    } finally {
      setLoadingList(false)
    }
  }, [selectedId])

  useEffect(() => {
    loadClientes()
  }, [loadClientes])

  useEffect(() => {
    if (!selectedId) return
    const fetchD = async () => {
      setLoadingData(true)
      try {
        setClienteData(await getClienteRelatorioDetalhado(selectedId))
      } catch (error: any) {
        toast.error('Erro: ' + (error.message || ''))
        setClienteData(null)
      } finally {
        setLoadingData(false)
      }
    }
    fetchD()
  }, [selectedId])

  const modulosData = useMemo(() => parseModulosData(clienteData), [clienteData])
  const modulosList = modulosData.adicionais
  const planoFranquia = modulosData.plano_base || clienteData?.plano_descricao || 'Não contratado'
  const valorMensalidade = clienteData?.valor_total ?? 0

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 no-print bg-white p-4 rounded-lg border border-slate-200 shadow-sm mb-6">
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-700 mb-2">Selecione o Cliente</p>
          {loadingList ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 h-10">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : (
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="w-full bg-white">
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
        <div className="flex items-end">
          <Button
            onClick={() => window.print()}
            disabled={!clienteData || loadingData}
            className="bg-[#1b4382] hover:bg-[#1b4382]/90 text-white w-full sm:w-auto h-10"
          >
            <Printer className="h-4 w-4 mr-2" /> Imprimir Relatório
          </Button>
        </div>
      </div>

      {loadingData ? (
        <div className="flex justify-center py-20 no-print">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : clienteData ? (
        <div className="report-document max-w-5xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0">
          <div className="flex items-center gap-8 border-b-2 border-slate-100 pb-8 mb-8">
            <img src={logoUrl} alt="Service Logic" className="h-16 object-contain" />
            <div>
              <h1 className="text-3xl font-bold text-[#1b4382]">Relatório de Contrato</h1>
              <p className="flex items-center gap-2 text-sm text-slate-600 mt-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                Documento gerado em {formatDate(new Date().toISOString())}
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden mb-8 print:border-slate-300">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x border-b divide-slate-200 border-slate-200 bg-slate-50/60 print:border-slate-300 print:divide-slate-300">
              <div className="p-4 flex gap-3">
                <UserRound className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase text-slate-500 mb-0.5 tracking-wider font-medium">
                    Razão Social
                  </p>
                  <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-tight">
                    {clienteData.nome}
                  </p>
                </div>
              </div>
              <div className="p-4 flex gap-3">
                <IdCard className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase text-slate-500 mb-0.5 tracking-wider font-medium">
                    CNPJ
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {clienteData.cnpj ? formatCNPJ(clienteData.cnpj) : '—'}
                  </p>
                </div>
              </div>
              <div className="p-4 flex gap-3">
                <Calendar className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase text-slate-500 mb-0.5 tracking-wider font-medium">
                    Data de Assinatura
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {formatDateBR(clienteData.data_assinatura)}
                  </p>
                </div>
              </div>
              <div className="p-4 flex gap-3">
                <CheckCircle2
                  className={`h-5 w-5 shrink-0 mt-0.5 ${clienteData.status === 'Inativo' || clienteData.status === 'Cancelado' ? 'text-red-500' : 'text-green-500'}`}
                />
                <div>
                  <p className="text-[10px] uppercase text-slate-500 mb-0.5 tracking-wider font-medium">
                    Status
                  </p>
                  <p
                    className={`text-sm font-semibold ${clienteData.status === 'Inativo' || clienteData.status === 'Cancelado' ? 'text-red-700' : 'text-green-700'}`}
                  >
                    {clienteData.status ?? 'Ativo'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-white print:divide-slate-300">
              <div className="p-4 flex gap-3">
                <Layers className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase text-slate-500 mb-0.5 tracking-wider font-medium">
                    Plano Atual de Franquia
                  </p>
                  <p className="text-sm font-semibold text-slate-800">{planoFranquia}</p>
                </div>
              </div>
              <div className="p-4 flex gap-3">
                <CircleDollarSign className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase text-slate-500 mb-0.5 tracking-wider font-medium">
                    Valor da Mensalidade
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {valorMensalidade > 0 ? formatCurrency(valorMensalidade) : '—'}
                  </p>
                </div>
              </div>
              <div className="p-4 flex gap-3">
                <Calendar className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase text-slate-500 mb-0.5 tracking-wider font-medium">
                    Data de Vencimento
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {clienteData.vencimento_mensal != null
                      ? `${clienteData.vencimento_mensal}º dia do mês`
                      : 'Não definido'}
                  </p>
                </div>
              </div>
              <div className="p-4 flex gap-3">
                <Timer className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase text-slate-500 mb-0.5 tracking-wider font-medium">
                    Valor de Implantação
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {clienteData.valor_implantacao != null && clienteData.valor_implantacao > 0
                      ? formatCurrency(clienteData.valor_implantacao)
                      : 'Não informado'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8 break-inside-avoid">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
              <Package className="h-3.5 w-3.5" />
              Módulos Contratados
            </p>
            <div className="border border-slate-200 rounded-lg p-5 bg-slate-50/60 print:border-slate-300">
              {modulosList.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {modulosList.map((modulo, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="bg-white border-slate-200 text-slate-700 py-1.5 px-3.5 font-medium flex items-center gap-2 shadow-sm rounded-full print:border-slate-300"
                    >
                      <CheckCircle2
                        className="h-4 w-4 text-[#1b4382]"
                        fill="#1b4382"
                        stroke="white"
                      />
                      {modulo}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">
                  Nenhum módulo contratado registrado.
                </p>
              )}
            </div>
          </div>

          {modulosList.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4 border-b-2 border-slate-100 pb-3 print:border-slate-200">
                <FileText className="h-5 w-5 text-slate-500" />
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-slate-700">
                  Descrição dos Módulos
                </h3>
              </div>
              <div className="space-y-0">
                {modulosList.map((modulo, idx) => {
                  const info = getModuleInfo(modulo)
                  const Icon = info?.icon || Settings
                  return (
                    <div
                      key={idx}
                      className="flex gap-4 py-4 border-b border-slate-100 last:border-0 break-inside-avoid print:border-slate-200"
                    >
                      <div className="mt-0.5">
                        <Icon className="h-6 w-6 text-[#f37021]" strokeWidth={1.5} />
                      </div>
                      <div className="w-[30%] shrink-0">
                        <p className="text-[13px] font-semibold text-[#1b4382] uppercase tracking-wide">
                          {modulo}
                        </p>
                      </div>
                      <div className="w-[70%]">
                        <p className="text-[13px] text-slate-600 leading-relaxed print:text-black">
                          {info?.desc || 'Módulo contratado sem descrição detalhada.'}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-200 bg-slate-50/80 rounded-xl p-6 flex flex-wrap justify-between items-center break-inside-avoid gap-4 print:border-slate-300">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2.5 rounded-full border border-slate-200 shadow-sm print:border-slate-300">
                <Mail className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-500 font-semibold mb-0.5 tracking-wider">
                  E-mail
                </p>
                <p className="text-xs font-medium text-slate-800">alinecosta@servicelogic.com.br</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white p-2.5 rounded-full border border-slate-200 shadow-sm print:border-slate-300">
                <Phone className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-500 font-semibold mb-0.5 tracking-wider">
                  Telefone
                </p>
                <p className="text-xs font-medium text-slate-800">(27) 99937-4475</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white p-2.5 rounded-full border border-slate-200 shadow-sm print:border-slate-300">
                <Globe className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-500 font-semibold mb-0.5 tracking-wider">
                  Site
                </p>
                <p className="text-xs font-medium text-slate-800">www.servicelogic.com.br</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500 no-print">
          Selecione um cliente para visualizar o relatório.
        </div>
      )}
    </div>
  )
}
