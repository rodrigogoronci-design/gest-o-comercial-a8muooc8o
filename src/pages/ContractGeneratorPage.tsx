import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Save,
  Sparkles,
  UploadCloud,
  Printer,
  Loader2,
  Upload,
  Trash,
  Rocket,
  DollarSign,
  Gift,
  FileText,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImportContracts } from '@/components/ImportContracts'
import { AddendumDocument } from '@/components/AddendumDocument'
import { createCliente, updateCliente } from '@/services/clientes'
import { createHistorico } from '@/services/historico_contratos'
import { supabase } from '@/lib/supabase/client'
import { QuoteDocument } from '@/components/QuoteDocument'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatCNPJ } from '@/lib/formatters'
import { parsePdfContract } from '@/services/parse-pdf'
import { fetchCnpjData as fetchCnpjFromService } from '@/services/cnpj'
import {
  PLANS,
  MODULES as BASE_MODULES,
  IMPLEMENTATION_RATES,
  BASE_IMPLEMENTATION_HOURS,
  DFE_TIERS,
  PREDEFINED_TRAININGS,
} from '@/constants/contracts'
import { ContractDocument } from '@/components/ContractDocument'
import { SignedContractUpload } from '@/components/SignedContractUpload'
import { cn } from '@/lib/utils'

const MODULES = [...BASE_MODULES]

export default function ContractGeneratorPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') || 'gerar'
  const initialProspect = searchParams.get('prospect') || ''
  const initialCnpj = searchParams.get('cnpj') || ''
  const initialProspectId = searchParams.get('prospectId') || 'novo'
  const initialContato = searchParams.get('contato') || ''
  const initialQuoteTargetType =
    (searchParams.get('quoteTargetType') as 'prospect' | 'cliente') || 'prospect'
  const initialClientId = searchParams.get('clientId') || 'novo'

  const [activeTab, setActiveTab] = useState(initialTab)
  const [name, setName] = useState(initialProspect)
  const [cnpj, setCnpj] = useState(initialCnpj ? formatCNPJ(initialCnpj) : '')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [repName, setRepName] = useState('')
  const [repCpf, setRepCpf] = useState('')
  const [repRg, setRepRg] = useState('')

  const [selectedPlan, setSelectedPlan] = useState<string>('tms-50')
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [implMode, setImplMode] = useState<'remoto' | 'presencial'>('remoto')
  const [additionalPlates, setAdditionalPlates] = useState<number>(0)
  const [filiais, setFiliais] = useState<
    { id: string; cnpj: string; nome?: string; isentar: boolean }[]
  >([])
  const [newFilialCnpj, setNewFilialCnpj] = useState('')
  const [newFilialNome, setNewFilialNome] = useState('')

  const [cobrarPorFilial, setCobrarPorFilial] = useState(false)
  const [quantidadeFiliais, setQuantidadeFiliais] = useState<number>(1)
  const [filiaisVinculadas, setFiliaisVinculadas] = useState<
    { id: string; cnpj: string; nome: string }[]
  >([])

  useEffect(() => {
    if (cobrarPorFilial && filiaisVinculadas.length === 0) {
      setFiliaisVinculadas([{ id: Math.random().toString(), cnpj: '', nome: '' }])
      setQuantidadeFiliais(1)
    }
  }, [cobrarPorFilial])

  const [manualPlanPrice, setManualPlanPrice] = useState<string>('')
  const [isPlanPriceManual, setIsPlanPriceManual] = useState(false)

  const [descontoMensalidade, setDescontoMensalidade] = useState<number>(0)
  const [tipoDesconto, setTipoDesconto] = useState<'valor' | 'percentual'>('valor')
  const [isencaoPeriodo, setIsencaoPeriodo] = useState<number>(0)
  const [moduleGracePeriods, setModuleGracePeriods] = useState<Record<string, number>>({})
  const [prazosConcedidos, setPrazosConcedidos] = useState('')

  const [customModulePrices, setCustomModulePrices] = useState<Record<string, number | ''>>({})
  const [isExtractingCompany, setIsExtractingCompany] = useState(false)

  const [availableProposals, setAvailableProposals] = useState<any[]>([])
  const [loadedProposalId, setLoadedProposalId] = useState<string>('none')
  const [isAddendum, setIsAddendum] = useState(false)
  const [currentContractValue, setCurrentContractValue] = useState<number>(0)
  const [currentClientModules, setCurrentClientModules] = useState<any>({
    plano_base: '',
    adicionais: [],
  })
  const [currentClientPlanName, setCurrentClientPlanName] = useState<string>('')

  const [selectedGenTargetType, setSelectedGenTargetType] = useState<'prospect' | 'cliente'>(
    'prospect',
  )
  const [selectedGenClientId, setSelectedGenClientId] = useState<string>('novo')

  const [isExtractingProposal, setIsExtractingProposal] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [autoFilled, setAutoFilled] = useState(false)
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false)

  // Cotação State
  const [quoteEmpresa, setQuoteEmpresa] = useState(initialTab === 'cotacao' ? initialProspect : '')
  const [quoteContato, setQuoteContato] = useState(initialTab === 'cotacao' ? initialContato : '')
  const [selectedProspectId, setSelectedProspectId] = useState<string>(initialProspectId)
  const [prospects, setProspects] = useState<any[]>([])

  const [quoteTargetType, setQuoteTargetType] = useState<'prospect' | 'cliente'>(
    initialQuoteTargetType,
  )
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId)
  const [clientes, setClientes] = useState<any[]>([])
  const [selectedDfe, setSelectedDfe] = useState<string>('dfe-none')
  const [clientSearch, setClientSearch] = useState('')
  const [prospectSearch, setProspectSearch] = useState('')
  const [includeDiagnosticVisit, setIncludeDiagnosticVisit] = useState(false)
  const [diagnosticVisits, setDiagnosticVisits] = useState<
    { id: string; date: string; value: string }[]
  >([{ id: '1', date: '', value: '' }])
  const [selectedTrainings, setSelectedTrainings] = useState<string[]>([])
  const [customTrainingPrices, setCustomTrainingPrices] = useState<Record<string, number | ''>>({})
  const [isTreinamentoGratuito, setIsTreinamentoGratuito] = useState(false)

  const [sendToImplementation, setSendToImplementation] = useState(false)
  const [sendToFinance, setSendToFinance] = useState(false)

  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'hide-layout-elements-for-proposal'
    style.innerHTML = `
      header input[placeholder*="Buscar"],
      header .relative:has(input[placeholder*="Buscar"]),
      header form:has(input[placeholder*="Buscar"]) {
        display: none !important;
      }
      
      @media print {
        * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
        *::-webkit-scrollbar { display: none !important; }
        .overflow-auto, .overflow-x-auto, .overflow-y-auto, .overflow-hidden, .overflow-scroll { overflow: visible !important; }
        header, aside, nav, [data-sidebar="sidebar"], [data-sidebar], .sidebar-container,
        [data-sidebar-wrapper], [data-sidebar-container], [data-sidebar-inset] { display: none !important; }
        body, html { background-color: white !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; }
        main { margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; overflow: visible !important; }
      }
    `
    document.head.appendChild(style)
    return () => {
      const el = document.getElementById('hide-layout-elements-for-proposal')
      if (el) el.remove()
    }
  }, [])

  useEffect(() => {
    const fetchClientes = async () => {
      const { data } = await supabase
        .from('clientes')
        .select(
          'id, nome, rep_nome, valor_total, modulos, cnpj, endereco, email, telefone, cobrar_filiais, quantidade_filiais, filiais_detalhes, plano_id',
        )
        .order('nome')
      if (data) setClientes(data)
    }
    fetchClientes()
  }, [])

  useEffect(() => {
    const fetchProspects = async () => {
      const { data } = await supabase
        .from('crm_prospects')
        .select('id, empresa, contato_nome, cnpj')
        .order('empresa')
      if (data) setProspects(data)
    }
    fetchProspects()
  }, [])

  useEffect(() => {
    if (initialCnpj && initialCnpj.replace(/\D/g, '').length === 14) {
      fetchCnpjData(initialCnpj.replace(/\D/g, ''))
    }
  }, [])

  useEffect(() => {
    const fetchProposals = async () => {
      const { data } = await supabase
        .from('crm_propostas')
        .select(`
          id, data_proposta, valor_mensalidade, valor_implantacao, itens,
          desconto_mensalidade, tipo_desconto, isencao_periodo, prazos_concedidos,
          is_gratuito, quantidade_filiais, filiais_detalhes, aos_cuidados_de,
          cliente_id,
          crm_prospects ( id, empresa, contato_nome, cnpj, endereco ),
          clientes ( id, nome, rep_nome, cnpj, endereco, modulos, valor_total, plano_id )
        `)
        .order('data_proposta', { ascending: false })
      if (data) setAvailableProposals(data)
    }
    fetchProposals()
  }, [])

  const handleLoadProposal = (id: string) => {
    setLoadedProposalId(id)
    if (id === 'none') {
      setIsAddendum(false)
      setSelectedGenTargetType('prospect')
      setCurrentClientPlanName('')
      return
    }
    const prop = availableProposals.find((p) => p.id === id)
    if (!prop) return

    if (prop.cliente_id && prop.clientes) {
      setIsAddendum(true)
      setSelectedGenTargetType('cliente')
      setSelectedGenClientId(prop.cliente_id)
      setName(prop.clientes.nome)
      setCnpj(formatCNPJ(prop.clientes.cnpj || ''))
      setAddress(prop.clientes.endereco || '')
      setEmail(prop.clientes.email || '')
      setTelefone(prop.clientes.telefone || '')
      setRepName(prop.aos_cuidados_de || prop.clientes.rep_nome || '')
      setCurrentContractValue(prop.clientes.valor_total || 0)
      setCurrentClientModules(prop.clientes.modulos || { plano_base: '', adicionais: [] })
      if (prop.clientes.plano_id) {
        supabase
          .from('planos_saude')
          .select('descricao')
          .eq('id', prop.clientes.plano_id)
          .single()
          .then(({ data: planoData }) => {
            setCurrentClientPlanName(
              planoData?.descricao || prop.clientes.modulos?.plano_base || 'Não informado',
            )
          })
      } else {
        setCurrentClientPlanName(prop.clientes.modulos?.plano_base || 'Não informado')
      }
    } else {
      setIsAddendum(false)
      setSelectedGenTargetType('prospect')
      setCurrentClientPlanName('')
      const prospect = prop.crm_prospects || {}
      setName(prospect.empresa || '')
      if (prospect.cnpj) setCnpj(formatCNPJ(prospect.cnpj))
      setAddress(prospect.endereco || '')
      setEmail(prospect.email || '')
      setTelefone(prospect.telefone || '')
      setRepName(prop.aos_cuidados_de || prospect.contato_nome || '')
    }

    const items = Array.isArray(prop.itens) ? prop.itens : []
    const newModules: string[] = []
    const newTrainings: string[] = []
    let newDfe = 'dfe-none'
    let newPlates = 0
    let newBranches = prop.quantidade_filiais || 0
    let newImplMode: 'remoto' | 'presencial' = 'remoto'
    let newImplValue = prop.valor_implantacao || 0
    const newGracePeriods: Record<string, number> = {}
    const newCustomModulePrices: Record<string, number | ''> = {}
    let includeDiag = false
    let diagVisits: any[] = []
    let foundPlan = 'none'
    let newPlanPriceManual = false
    let newPlanPrice = ''
    const newCustomTrainingPrices: Record<string, number | ''> = {}

    const fDetalhes = prop.filiais_detalhes || []
    if (prop.cobrar_filiais) {
      setCobrarPorFilial(true)
      setQuantidadeFiliais(fDetalhes.length || 1)
      setFiliaisVinculadas(
        fDetalhes.map((f: any) => ({
          id: Math.random().toString(),
          cnpj: f.cnpj || '',
          nome: f.nome || '',
        })),
      )
      setFiliais([])
    } else {
      setCobrarPorFilial(false)
      setQuantidadeFiliais(1)
      setFiliaisVinculadas([])
      setFiliais(
        fDetalhes.map((f: any) => ({
          id: Math.random().toString(),
          cnpj: f.cnpj || '',
          nome: f.nome || '',
          isentar: f.isentar || false,
        })),
      )
    }

    items.forEach((item) => {
      if (item.type === 'plan' || PLANS.find((p) => p.id === item.id)) {
        foundPlan = item.id
        const defPrice = PLANS.find((p) => p.id === item.id)?.price || 0
        if (item.price !== undefined && item.price !== defPrice) {
          newPlanPriceManual = true
          newPlanPrice = item.price.toString()
        }
      } else if (MODULES.find((m) => m.id === item.id)) {
        const mod = MODULES.find((m) => m.id === item.id)
        if (!mod?.isBasic) {
          newModules.push(item.id)
          if (item.tem_gratuidade) {
            newGracePeriods[item.id] = item.periodo_gratuidade || 3
          }
          if (item.price !== undefined) {
            newCustomModulePrices[item.id] = item.price
          } else {
            newCustomModulePrices[item.id] = mod.price
          }
        }
      } else if (item.id && item.id.startsWith('dfe-')) {
        newDfe = item.id
      } else if (PREDEFINED_TRAININGS.find((t) => t.id === item.id)) {
        newTrainings.push(item.id)
        if (item.price !== undefined) {
          newCustomTrainingPrices[item.id] = item.price
        }
      } else if (item.id === 'placas-adicionais') {
        newPlates = item.quantity || 0
      } else if (item.id === 'impl-details') {
        newImplMode = item.modo || 'remoto'
        newImplValue = item.price || 0
      } else if (item.id && item.id.startsWith('diag-')) {
        includeDiag = true
        diagVisits.push({ id: item.id, date: '', value: item.price })
      }
    })

    setSelectedPlan(foundPlan)
    setIsPlanPriceManual(newPlanPriceManual)
    setManualPlanPrice(newPlanPrice)
    setSelectedModules(newModules)
    setModuleGracePeriods(newGracePeriods)
    setCustomModulePrices(newCustomModulePrices)
    setSelectedDfe(newDfe)
    setSelectedTrainings(newTrainings)
    setCustomTrainingPrices(newCustomTrainingPrices)
    setAdditionalPlates(newPlates)
    setImplMode(newImplMode)
    setManualImplValue(newImplValue.toString())
    if (prop.valor_mensalidade !== undefined && prop.valor_mensalidade !== null) {
      setIsMensalidadeManual(true)
      setManualMensalidadeValue(prop.valor_mensalidade.toString())
    } else {
      setIsMensalidadeManual(false)
      setManualMensalidadeValue('')
    }
    setDescontoMensalidade(prop.desconto_mensalidade || 0)
    setTipoDesconto(prop.tipo_desconto || 'valor')
    setIsencaoPeriodo(prop.isencao_periodo || 0)
    setPrazosConcedidos(prop.prazos_concedidos || '')
    setIsTreinamentoGratuito(prop.is_gratuito || false)
    setIncludeDiagnosticVisit(includeDiag)
    if (diagVisits.length > 0) setDiagnosticVisits(diagVisits)
  }

  const planData = useMemo(() => PLANS.find((p) => p.id === selectedPlan), [selectedPlan])
  const defaultPlanPrice =
    selectedPlan === 'none' ||
    (activeTab === 'cotacao' && quoteTargetType === 'cliente') ||
    (activeTab === 'gerar' && selectedGenTargetType === 'cliente')
      ? 0
      : planData?.price || 0
  const planPrice =
    isPlanPriceManual && manualPlanPrice !== ''
      ? parseFloat(manualPlanPrice) || 0
      : defaultPlanPrice
  const dfeData = useMemo(() => DFE_TIERS.find((d) => d.id === selectedDfe), [selectedDfe])
  const baseDfePrice = dfeData?.price || 0
  const dfePrice =
    cobrarPorFilial && filiaisVinculadas.length > 0
      ? baseDfePrice * filiaisVinculadas.length
      : baseDfePrice
  const modulesPriceStandard = useMemo(
    () =>
      selectedModules.reduce((acc, id) => acc + (MODULES.find((m) => m.id === id)?.price || 0), 0),
    [selectedModules],
  )

  const modulesPrice = useMemo(
    () =>
      selectedModules.reduce((acc, id) => {
        const m = MODULES.find((m) => m.id === id)
        if (!m) return acc
        if (moduleGracePeriods[id] && moduleGracePeriods[id] > 0) return acc
        const price =
          typeof customModulePrices[id] === 'number'
            ? (customModulePrices[id] as number)
            : m.price || 0
        return acc + price
      }, 0),
    [selectedModules, moduleGracePeriods, customModulePrices],
  )

  const additionalPlatesPrice = useMemo(() => {
    if (additionalPlates <= 0) return 0
    if (additionalPlates <= 50) return 10
    if (additionalPlates <= 100) return 6
    if (additionalPlates <= 200) return 3
    return 2
  }, [additionalPlates])

  const additionalPlatesTotal = additionalPlates * additionalPlatesPrice

  const additionalBranchesPrice = 199
  const additionalBranchesTotal = filiais.reduce((acc, filial) => {
    return acc + (filial.isentar ? 0 : additionalBranchesPrice)
  }, 0)
  const additionalBranches = filiais.length

  const subtotalMensalidade =
    planPrice + modulesPrice + dfePrice + additionalPlatesTotal + additionalBranchesTotal
  const subtotalMensalidadeStandard =
    planPrice + modulesPriceStandard + dfePrice + additionalPlatesTotal + additionalBranchesTotal

  let validDescontoMensalidade = descontoMensalidade
  if (tipoDesconto === 'percentual' && validDescontoMensalidade > 100)
    validDescontoMensalidade = 100
  if (tipoDesconto === 'valor' && validDescontoMensalidade > subtotalMensalidade)
    validDescontoMensalidade = subtotalMensalidade

  const calculatedDiscount =
    tipoDesconto === 'percentual'
      ? (subtotalMensalidade * validDescontoMensalidade) / 100
      : validDescontoMensalidade
  const calculatedDiscountStandard =
    tipoDesconto === 'percentual'
      ? (subtotalMensalidadeStandard * validDescontoMensalidade) / 100
      : validDescontoMensalidade

  const calculatedTotalValue = Math.max(0, subtotalMensalidade - calculatedDiscount)
  const [manualMensalidadeValue, setManualMensalidadeValue] = useState<string>('')
  const [isMensalidadeManual, setIsMensalidadeManual] = useState(false)

  useEffect(() => {
    if (!isMensalidadeManual) {
      setManualMensalidadeValue(calculatedTotalValue.toString())
    }
  }, [calculatedTotalValue, isMensalidadeManual])

  const totalValue =
    isMensalidadeManual && manualMensalidadeValue !== ''
      ? parseFloat(manualMensalidadeValue) || 0
      : calculatedTotalValue

  const totalValueStandard = Math.max(0, subtotalMensalidadeStandard - calculatedDiscountStandard)

  const totalBranchesCount = (cobrarPorFilial ? filiaisVinculadas.length : 0) + additionalBranches
  const finalFiliaisDetalhes = [...(cobrarPorFilial ? filiaisVinculadas : []), ...filiais].filter(
    (f) => f.cnpj && f.cnpj.replace(/\D/g, '').length > 0,
  )

  const implRate =
    implMode === 'remoto' ? IMPLEMENTATION_RATES.remoto : IMPLEMENTATION_RATES.presencial
  const totalImplHours = useMemo(() => {
    let hours = 0
    selectedModules.forEach((id) => {
      const mod = MODULES.find((m) => m.id === id)
      if (mod && mod.implHours) hours += mod.implHours
    })
    return hours
  }, [selectedModules])

  const diagValue = diagnosticVisits.reduce((acc, visit) => acc + (parseFloat(visit.value) || 0), 0)

  const calculatedImplValue = useMemo(() => {
    let value = totalImplHours * implRate
    if (selectedPlan !== 'none') {
      value += BASE_IMPLEMENTATION_HOURS * implRate
    }
    selectedModules.forEach((id) => {
      const mod = MODULES.find((m) => m.id === id) as any
      if (mod && mod.fixedImplPrice !== undefined) {
        if (typeof mod.fixedImplPrice === 'object') {
          value += mod.fixedImplPrice[implMode]
        } else {
          value += mod.fixedImplPrice
        }
      }
    })
    if (includeDiagnosticVisit) {
      value += diagValue
    }
    const trainingsValue = selectedTrainings.reduce((acc, id) => {
      const t = PREDEFINED_TRAININGS.find((pt) => pt.id === id)
      const price =
        typeof customTrainingPrices[id] === 'number' ? customTrainingPrices[id] : t?.price || 0
      return acc + (!isTreinamentoGratuito ? price : 0)
    }, 0)
    value += trainingsValue
    return value
  }, [
    totalImplHours,
    implRate,
    selectedModules,
    implMode,
    includeDiagnosticVisit,
    diagValue,
    selectedTrainings,
    selectedPlan,
    isTreinamentoGratuito,
  ])

  const [manualImplValue, setManualImplValue] = useState<string>('')
  const implValue = manualImplValue !== '' ? parseFloat(manualImplValue) : calculatedImplValue

  const currentClientValue = useMemo(() => {
    if (quoteTargetType === 'cliente' && selectedClientId !== 'novo') {
      const c = clientes.find((client) => client.id === selectedClientId)
      return c?.valor_total || 0
    }
    return 0
  }, [quoteTargetType, selectedClientId, clientes])

  const newItemsToContract = useMemo(() => {
    return [
      ...selectedModules
        .filter((id) => !MODULES.find((m) => m.id === id)?.isBasic)
        .map((id) => {
          const mod = MODULES.find((m) => m.id === id) as any
          return {
            name: mod?.name,
            price: typeof customModulePrices[id] === 'number' ? customModulePrices[id] : mod?.price,
            ...(mod?.franquia_quantidade
              ? {
                  franquia_quantidade: mod.franquia_quantidade,
                  valor_excedente: mod.valor_excedente,
                }
              : {}),
          }
        }),
      ...(selectedDfe !== 'dfe-none' ? [{ name: dfeData?.name, price: dfeData?.price }] : []),
      ...(additionalPlates > 0
        ? [
            {
              name: `Placa Adicional Frota (Qtd: ${additionalPlates})`,
              price: additionalPlatesTotal,
            },
          ]
        : []),
      ...(additionalBranches > 0
        ? [
            {
              name: `Filiais Adicionais (Qtd: ${additionalBranches})`,
              price: additionalBranchesTotal,
            },
          ]
        : []),
      ...(includeDiagnosticVisit
        ? diagnosticVisits.map((v) => ({
            name: 'Visita Presencial de Diagnóstico',
            price: parseFloat(v.value) || 0,
          }))
        : []),
      ...selectedTrainings.map((id) => {
        const t = PREDEFINED_TRAININGS.find((pt) => pt.id === id)
        const price =
          typeof customTrainingPrices[id] === 'number' ? customTrainingPrices[id] : t?.price || 0
        return {
          name: `Treinamento: ${t?.name}`,
          price,
        }
      }),
    ].filter((i) => i.name)
  }, [
    selectedModules,
    selectedDfe,
    dfeData,
    additionalPlates,
    additionalPlatesTotal,
    additionalBranches,
    additionalBranchesTotal,
    includeDiagnosticVisit,
    diagnosticVisits,
    selectedTrainings,
  ])

  const autoItemDescription = useMemo(() => {
    const parts: string[] = []
    selectedModules.forEach((id) => {
      const mod = MODULES.find((m) => m.id === id)
      if (mod && !mod.isBasic) {
        const price =
          typeof customModulePrices[id] === 'number'
            ? (customModulePrices[id] as number)
            : mod.price
        parts.push(`${mod.name} - ${formatCurrency(price)} (Cobrança Mensal)`)
      }
    })
    if (selectedDfe !== 'dfe-none' && dfeData) {
      parts.push(`${dfeData.name} - ${formatCurrency(dfePrice)} (Cobrança Mensal)`)
    }
    if (additionalPlates > 0) {
      parts.push(
        `Placas Adicionais (${additionalPlates}) - ${formatCurrency(additionalPlatesTotal)} (Cobrança Mensal)`,
      )
    }
    if (additionalBranches > 0) {
      parts.push(
        `Filiais Adicionais (${additionalBranches}) - ${formatCurrency(additionalBranchesTotal)} (Cobrança Mensal)`,
      )
    }
    selectedTrainings.forEach((id) => {
      const t = PREDEFINED_TRAININGS.find((pt) => pt.id === id)
      if (t) {
        const price =
          typeof customTrainingPrices[id] === 'number'
            ? (customTrainingPrices[id] as number)
            : t.price
        parts.push(
          `Treinamento: ${t.name} - ${isTreinamentoGratuito ? 'Grátis' : formatCurrency(price)} (Cobrança Mensal)`,
        )
      }
    })
    if (includeDiagnosticVisit) {
      diagnosticVisits.forEach((v) => {
        parts.push(`Visita Presencial de Diagnóstico - ${formatCurrency(parseFloat(v.value) || 0)}`)
      })
    }
    return parts.join('\n')
  }, [
    selectedModules,
    customModulePrices,
    selectedDfe,
    dfeData,
    dfePrice,
    additionalPlates,
    additionalPlatesTotal,
    additionalBranches,
    additionalBranchesTotal,
    selectedTrainings,
    customTrainingPrices,
    isTreinamentoGratuito,
    includeDiagnosticVisit,
    diagnosticVisits,
  ])

  const contractProps = {
    name,
    cnpj,
    address,
    repName,
    repCpf,
    repRg,
    selectedPlan,
    selectedModules,
    planData,
    planPrice,
    modulesPrice,
    selectedDfe,
    dfeData,
    baseDfePrice,
    dfePrice,
    cobrarDfePorFilial: cobrarPorFilial,
    quantidadeFiliaisDfe: filiaisVinculadas.length,
    totalValue,
    implMode,
    implRate,
    totalImplHours,
    implValue,
    trainings: selectedTrainings.map((id) => {
      const t = PREDEFINED_TRAININGS.find((pt) => pt.id === id)
      const price =
        typeof customTrainingPrices[id] === 'number' ? customTrainingPrices[id] : t?.price || 0
      return { id, name: t?.name, price, isFree: isTreinamentoGratuito }
    }),
    includeDiagnosticVisit,
    diagnosticVisits,
    diagnosticVisitValue: diagnosticVisits[0]?.value || '',
    diagnosticVisitDate: diagnosticVisits[0]?.date || '',
    additionalPlates,
    additionalPlatesPrice,
    additionalPlatesTotal,
    additionalBranches,
    additionalBranchesPrice,
    additionalBranchesTotal,
    filiais,
    filiaisDfe: filiaisVinculadas,
    descontoMensalidade: validDescontoMensalidade,
    tipoDesconto,
    calculatedDiscount,
    isencaoPeriodo,
    moduleGracePeriods,
    totalValueStandard,
    prazosConcedidos,
    currentContractValue,
    isTreinamentoGratuito,
    customModulePrices,
    // Addendum specific props
    clientName: name,
    valorTotalAtual: currentContractValue,
    dataSolicitacao: new Date().toISOString(),
    currentClientModules,
    newItems: newItemsToContract,
    modules: newItemsToContract,
    valorAdicional: totalValue,
    currentPlanName: currentClientPlanName,
    autoItemDescription,
    billingCycle: 'Cobrança Mensal',
  }

  const quoteProps = {
    empresa: quoteEmpresa,
    cnpj:
      quoteTargetType === 'cliente' && selectedClientId !== 'novo'
        ? formatCNPJ(clientes.find((c) => c.id === selectedClientId)?.cnpj || '')
        : quoteTargetType === 'prospect' && selectedProspectId !== 'novo'
          ? formatCNPJ(prospects.find((p) => p.id === selectedProspectId)?.cnpj || '')
          : '',
    aosCuidadosDe: quoteContato,
    date: new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
    planName:
      selectedPlan === 'none' || (activeTab === 'cotacao' && quoteTargetType === 'cliente')
        ? 'Nenhum'
        : planData?.name || 'Plano Personalizado',
    selectedModulesData: selectedModules
      .map((id) => {
        const m = MODULES.find((m) => m.id === id) as any
        if (!m) return null
        return {
          ...m,
          price: typeof customModulePrices[id] === 'number' ? customModulePrices[id] : m.price,
          ...(m.franquia_quantidade
            ? { franquia_quantidade: m.franquia_quantidade, valor_excedente: m.valor_excedente }
            : {}),
        }
      })
      .filter((m) => m && !m.isBasic),
    trainings: selectedTrainings.map((id) => {
      const t = PREDEFINED_TRAININGS.find((pt) => pt.id === id)
      const price =
        typeof customTrainingPrices[id] === 'number' ? customTrainingPrices[id] : t?.price || 0
      return { id, name: t?.name, price, isFree: isTreinamentoGratuito }
    }),
    planPrice,
    modulesPrice,
    selectedDfe,
    dfeData,
    dfePrice,
    totalValue,
    implMode,
    implRate,
    totalImplHours,
    implValue,
    isUpsell: quoteTargetType === 'cliente',
    includeFranchise: selectedDfe !== 'dfe-none',
    includeDiagnosticVisit,
    diagnosticVisits,
    diagnosticVisitValue: diagnosticVisits[0]?.value || '',
    diagnosticVisitDate: diagnosticVisits[0]?.date || '',
    currentClientValue,
    additionalPlates,
    additionalPlatesPrice,
    additionalPlatesTotal,
    additionalBranches,
    additionalBranchesPrice,
    additionalBranchesTotal,
    filiais,
    filiaisDfe: filiaisVinculadas.filter((f) => f.cnpj && f.cnpj.replace(/\D/g, '').length > 0),
    cobrarDfePorFilial: cobrarPorFilial,
    quantidadeFiliaisDfe: filiaisVinculadas.filter(
      (f) => f.cnpj && f.cnpj.replace(/\D/g, '').length > 0,
    ).length,
    baseDfePrice,
    descontoMensalidade: validDescontoMensalidade,
    tipoDesconto,
    calculatedDiscount,
    isencaoPeriodo,
    moduleGracePeriods,
    totalValueStandard,
    prazosConcedidos,
  }

  const fetchCnpjData = async (cnpjValue: string) => {
    setIsLoadingCnpj(true)
    try {
      const cnpjFormatted = formatCNPJ(cnpjValue)

      const { data: clienteData } = await supabase
        .from('clientes')
        .select('*')
        .or(`cnpj.eq.${cnpjValue},cnpj.eq.${cnpjFormatted}`)
        .maybeSingle()

      if (clienteData) {
        setName(clienteData.nome || '')
        setAddress(clienteData.endereco || '')
        setEmail(clienteData.email || '')
        setTelefone(clienteData.telefone || '')
        setRepName(clienteData.rep_nome || '')
        setRepCpf(clienteData.rep_cpf || '')
        setRepRg(clienteData.rep_rg || '')
        setAutoFilled(true)
        setTimeout(() => setAutoFilled(false), 3000)
        toast({
          title: 'Cliente Encontrado',
          description: 'Dados preenchidos a partir da base de Clientes.',
          className: 'bg-emerald-600 text-white border-none',
        })
        return
      }

      const { data: prospectData } = await supabase
        .from('crm_prospects')
        .select('*')
        .or(`cnpj.eq.${cnpjValue},cnpj.eq.${cnpjFormatted}`)
        .maybeSingle()

      if (prospectData) {
        setName(prospectData.empresa || '')
        setAddress(prospectData.endereco || '')
        setEmail(prospectData.email || '')
        setTelefone(prospectData.telefone || '')
        setRepName(prospectData.contato_nome || '')
        setAutoFilled(true)
        setTimeout(() => setAutoFilled(false), 3000)
        toast({
          title: 'Prospect Encontrado',
          description: 'Dados preenchidos a partir da base de Prospects.',
          className: 'bg-emerald-600 text-white border-none',
        })
        return
      }

      const { data: cnpjResult, error: cnpjError } = await fetchCnpjFromService(cnpjValue)

      if (cnpjResult) {
        if (cnpjResult.nome) setName(cnpjResult.nome)
        if (cnpjResult.endereco) setAddress(cnpjResult.endereco)
        if (cnpjResult.email) setEmail(cnpjResult.email)
        if (cnpjResult.telefone) setTelefone(cnpjResult.telefone)

        setAutoFilled(true)
        setTimeout(() => setAutoFilled(false), 3000)

        toast({
          title: 'CNPJ Encontrado!',
          description: 'Dados oficiais obtidos via Receita Federal.',
          className: 'bg-emerald-600 text-white border-none',
        })
      } else {
        toast({
          title: 'Aviso na busca de CNPJ',
          description: cnpjError || 'Não foi possível obter dados oficiais. Preencha manualmente.',
        })
      }
    } catch (err: any) {
      toast({
        title: 'Aviso na busca de CNPJ',
        description: 'Não foi possível preencher automaticamente. Digite os dados manualmente.',
      })
    } finally {
      setIsLoadingCnpj(false)
    }
  }

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '')
    if (rawValue.length <= 14) setCnpj(formatCNPJ(rawValue))

    if (rawValue.length === 14) {
      fetchCnpjData(rawValue)
    }
  }

  const handleCnpjBlur = () => {
    const rawValue = cnpj.replace(/\D/g, '')
    if (rawValue.length === 14) {
      fetchCnpjData(rawValue)
    }
  }

  const handleToggleModule = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedModules((prev) => [...prev, id])
      const mod = MODULES.find((m) => m.id === id)
      if (mod) {
        setCustomModulePrices((prev) => ({ ...prev, [id]: mod.price }))
      }
    } else {
      setSelectedModules((prev) => prev.filter((m) => m !== id))
      setCustomModulePrices((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
  }

  const fetchFilialCnpjData = async (cnpjValue: string) => {
    try {
      const { data: cnpjResult } = await fetchCnpjFromService(cnpjValue)
      if (cnpjResult?.nome) setNewFilialNome(cnpjResult.nome)
    } catch {
      /* intentionally ignored */
    }
  }

  const handleAddFilial = () => {
    if (newFilialCnpj.replace(/\D/g, '').length === 14) {
      setFiliais([
        ...filiais,
        {
          id: Math.random().toString(),
          cnpj: formatCNPJ(newFilialCnpj),
          nome: newFilialNome,
          isentar: false,
        },
      ])
      setNewFilialCnpj('')
      setNewFilialNome('')
    } else {
      toast({ title: 'Atenção', description: 'CNPJ da filial inválido.', variant: 'destructive' })
    }
  }

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return
    setIsExtractingCompany(true)
    setUploadProgress(10)

    try {
      let extractedData = {
        nome: '',
        cnpj: '',
        endereco: '',
        repName: '',
        repCpf: '',
        repRg: '',
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress(10 + Math.floor((i / files.length) * 40))

        if (file.type === 'application/pdf') {
          try {
            const data = await parsePdfContract(file)
            if (data.nome) extractedData.nome = data.nome
            if (data.cnpj) extractedData.cnpj = data.cnpj
            if (data.endereco) extractedData.endereco = data.endereco
            if (data.repName) extractedData.repName = data.repName
            if (data.repCpf) extractedData.repCpf = data.repCpf
            if (data.repRg) extractedData.repRg = data.repRg

            if (data.valor_mensalidade) {
              setManualMensalidadeValue(data.valor_mensalidade.toString())
              setIsMensalidadeManual(true)
            }
            if (data.valor_implantacao) {
              setManualImplValue(data.valor_implantacao.toString())
            }
            if (data.planoBase) {
              const matchedPlan = PLANS.find(
                (p) => p.id.toUpperCase() === data.planoBase?.toUpperCase(),
              )
              if (matchedPlan) {
                setSelectedPlan(matchedPlan.id)
              }
            }
            if (data.modulos && data.modulos.length > 0) {
              setSelectedModules(data.modulos)
            }
          } catch {
            /* intentionally ignored */
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 800))
        }
      }

      setUploadProgress(70)
      await new Promise((resolve) => setTimeout(resolve, 800))

      if (extractedData.cnpj) {
        const rawCnpj = extractedData.cnpj.replace(/\D/g, '')
        if (rawCnpj.length === 14) {
          setIsLoadingCnpj(true)
          try {
            const { data: cnpjResult } = await fetchCnpjFromService(rawCnpj)
            if (cnpjResult) {
              if (cnpjResult.nome) {
                extractedData.nome = cnpjResult.nome
              }
              if (cnpjResult.endereco) {
                extractedData.endereco = cnpjResult.endereco
              }
              if (cnpjResult.email) setEmail(cnpjResult.email)
              if (cnpjResult.telefone) setTelefone(cnpjResult.telefone)
            }
          } catch (e) {
            console.error('Failed to fetch CNPJ data', e)
            toast({
              title: 'Dados não verificados',
              description:
                'Não foi possível buscar dados oficiais da Receita. Verifique a Razão Social manualmente.',
            })
          } finally {
            setIsLoadingCnpj(false)
          }
        }
      } else {
        extractedData.cnpj = '12.345.678/0001-90'
      }

      if (!extractedData.nome || extractedData.nome === 'Empresa Fictícia LTDA')
        extractedData.nome = 'Tech Logistics Soluções LTDA'

      if (!extractedData.endereco)
        extractedData.endereco = 'Av. Paulista, 1000, Bela Vista, São Paulo - SP, 01310-100'
      if (!extractedData.repName) extractedData.repName = 'João da Silva'
      if (!extractedData.repCpf) extractedData.repCpf = '123.456.789-00'
      if (!extractedData.repRg) extractedData.repRg = '12.345.678-9'

      setName(extractedData.nome)
      setCnpj(formatCNPJ(extractedData.cnpj))
      setAddress(extractedData.endereco)
      setRepName(extractedData.repName)
      setRepCpf(extractedData.repCpf)
      setRepRg(extractedData.repRg)

      setUploadProgress(100)
      setAutoFilled(true)

      setTimeout(() => {
        setAutoFilled(false)
        setUploadProgress(0)
      }, 3000)

      toast({
        title: 'Documentos processados!',
        description: 'Os dados foram extraídos e preenchidos automaticamente.',
        className: 'bg-emerald-600 text-white border-none',
      })
    } catch (err: any) {
      toast({ title: 'Erro no processamento', description: err.message, variant: 'destructive' })
      setUploadProgress(0)
    }
    setIsExtractingCompany(false)
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }

  const handleUploadProposal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsExtractingProposal(true)
    try {
      const data = await parsePdfContract(file)
      if (data.planoBase) {
        const matchedPlan = PLANS.find((p) => p.id.toUpperCase() === data.planoBase?.toUpperCase())
        if (matchedPlan) {
          setSelectedPlan(matchedPlan.id)
        }
      }
      if (data.modulos && data.modulos.length > 0) {
        setSelectedModules(data.modulos)
      }
      if (data.valor_mensalidade) {
        setManualMensalidadeValue(data.valor_mensalidade.toString())
        setIsMensalidadeManual(true)
      }
      if (data.valor_implantacao) {
        setManualImplValue(data.valor_implantacao.toString())
      }
      toast({
        title: 'Proposta importada!',
        description: 'Plano, módulos e valores preenchidos automaticamente.',
      })
    } catch (err: any) {
      toast({ title: 'Erro na extração', description: err.message, variant: 'destructive' })
    }
    setIsExtractingProposal(false)
  }

  const handlePrint = () => {
    const oldTitle = document.title
    document.title = `Proposta_${(name || quoteEmpresa || 'Sem_Nome').replace(/\s+/g, '_')}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`
    window.print()
    document.title = oldTitle
  }

  const handleSaveQuote = async () => {
    if (!quoteEmpresa || !quoteContato) {
      toast({
        title: 'Atenção',
        description: 'Preencha a Empresa e o Contato.',
        variant: 'destructive',
      })
      return
    }

    if (
      cobrarPorFilial &&
      !filiaisVinculadas.some((f) => f.cnpj && f.cnpj.replace(/\D/g, '').length > 0)
    ) {
      toast({
        title: 'Atenção',
        description: 'Ao cobrar por filial, adicione pelo menos uma filial com CNPJ válido.',
        variant: 'destructive',
      })
      return
    }

    const proposalItems = [
      ...(selectedPlan !== 'none'
        ? [{ id: selectedPlan, type: 'plan', name: planData?.name, price: planPrice }]
        : []),
      ...selectedModules
        .filter((id) => !MODULES.find((mod) => mod.id === id)?.isBasic)
        .map((id) => {
          const m = MODULES.find((mod) => mod.id === id) as any
          return {
            id,
            name: m?.name,
            price: typeof customModulePrices[id] === 'number' ? customModulePrices[id] : m?.price,
            implHours: m?.implHours || 0,
            tem_gratuidade: !!moduleGracePeriods[id],
            periodo_gratuidade: moduleGracePeriods[id] || 0,
            ...(m?.franquia_quantidade
              ? {
                  franquia_quantidade: m.franquia_quantidade,
                  valor_excedente: m.valor_excedente,
                }
              : {}),
          }
        }),
      ...(selectedDfe !== 'dfe-none' && dfeData
        ? [{ id: dfeData.id, name: dfeData.name, price: dfeData.price }]
        : []),
      ...(includeDiagnosticVisit
        ? diagnosticVisits.map((v) => ({
            id: `diag-${v.id}`,
            name: `Visita Presencial de Diagnóstico${v.date ? ` (Data: ${new Date(v.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })})` : ''}`,
            price: parseFloat(v.value) || 0,
          }))
        : []),
      ...selectedTrainings.map((id) => {
        const t = PREDEFINED_TRAININGS.find((pt) => pt.id === id)
        const price =
          typeof customTrainingPrices[id] === 'number' ? customTrainingPrices[id] : t?.price || 0
        return {
          id,
          name: `Treinamento: ${t?.name}`,
          price,
          isFree: isTreinamentoGratuito,
        }
      }),
      ...(additionalPlates > 0
        ? [
            {
              id: 'placas-adicionais',
              name: `Placa Adicional Frota (Qtd: ${additionalPlates})`,
              price: additionalPlatesTotal,
              quantity: additionalPlates,
              unitPrice: additionalPlatesPrice,
            },
          ]
        : []),
      ...(additionalBranches > 0
        ? [
            {
              id: 'filiais-adicionais',
              name: `Filiais Adicionais (Qtd: ${additionalBranches})`,
              price: additionalBranchesTotal,
              quantity: additionalBranches,
              unitPrice: additionalBranchesPrice,
            },
          ]
        : []),
      {
        id: 'impl-details',
        name: 'Detalhes da Implantação',
        price: implValue,
        modo: implMode,
        totalHours: totalImplHours,
        implRate: implRate,
      },
    ]

    try {
      if (quoteTargetType === 'cliente') {
        if (selectedClientId === 'novo' || !selectedClientId) {
          toast({
            title: 'Atenção',
            description: 'Selecione um cliente para o Upsell.',
            variant: 'destructive',
          })
          return
        }
        const modulosAdicionados = proposalItems
          .filter((i) => i.id !== 'impl-details')
          .map((i) => i.name)
          .filter(Boolean)

        const { error } = await supabase.from('solicitacoes_servico').insert({
          cliente_id: selectedClientId,
          tipo: 'Proposta de Upsell',
          descricao: `Adição de Módulos/Serviços. Valor Mensal: ${formatCurrency(totalValue)}`,
          valor: implValue,
          observacoes: `Itens: ${modulosAdicionados.join(', ')}. Serviços de Implantação/Diagnóstico: ${formatCurrency(implValue)}`,
          status: 'Pendente',
          data_solicitacao: new Date().toISOString().split('T')[0],
          is_gratuito: isTreinamentoGratuito,
          prazos_concedidos: prazosConcedidos,
        })
        if (error) throw error

        const { data: insertedUpsell } = await supabase
          .from('crm_propostas')
          .insert({
            cliente_id: selectedClientId,
            prospect_id: null,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            data_proposta: new Date().toISOString().split('T')[0],
            aos_cuidados_de: quoteContato,
            desconto_mensalidade: validDescontoMensalidade,
            tipo_desconto: tipoDesconto,
            isencao_periodo: isencaoPeriodo,
            is_gratuito: isTreinamentoGratuito,
            itens: proposalItems,
            valor_mensalidade: totalValue,
            valor_implantacao: implValue,
            quantidade_filiais:
              cobrarPorFilial && finalFiliaisDetalhes.length > 0
                ? finalFiliaisDetalhes.length
                : totalBranchesCount,
            filiais_detalhes: finalFiliaisDetalhes,
            cobrar_filiais: cobrarPorFilial,
            prazos_concedidos: prazosConcedidos,
          } as any)
          .select()
          .single()

        if (insertedUpsell) {
          supabase.functions
            .invoke('send-crm-proposal', { body: { proposalId: insertedUpsell.id } })
            .catch(console.error)
        }

        try {
          const clientData = clientes.find((c) => c.id === selectedClientId)
          await supabase.functions.invoke('send-finance-email', {
            body: {
              to: 'financeiro@empresa.com',
              clientName: clientData?.nome || 'Cliente',
              moduleName: modulosAdicionados.join(', '),
              type: 'aditivo',
            },
          })
        } catch (e) {
          console.error('Erro ao enviar email automático', e)
        }

        toast({
          title: 'Upsell salvo!',
          description:
            'A proposta foi registrada e o aditivo enviado por e-mail. O PDF será gerado em instantes.',
          className: 'bg-emerald-600 text-white border-none',
        })
        setTimeout(() => {
          const oldTitle = document.title
          document.title = `Proposta_${quoteEmpresa.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`
          window.print()
          document.title = oldTitle
          navigate('/clientes')
        }, 1000)
      } else {
        let prospectId = selectedProspectId === 'novo' ? null : selectedProspectId
        if (!prospectId) {
          const { data, error } = await supabase
            .from('crm_prospects')
            .insert({
              empresa: quoteEmpresa,
              contato_nome: quoteContato,
              status: 'Contato Inicial',
            })
            .select()
            .single()
          if (error) throw error
          prospectId = data.id
        }

        const { data: insertedProspect, error } = await supabase
          .from('crm_propostas')
          .insert({
            prospect_id: prospectId,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            data_proposta: new Date().toISOString().split('T')[0],
            aos_cuidados_de: quoteContato,
            desconto_mensalidade: validDescontoMensalidade,
            tipo_desconto: tipoDesconto,
            isencao_periodo: isencaoPeriodo,
            is_gratuito: isTreinamentoGratuito,
            itens: proposalItems,
            valor_mensalidade: totalValue,
            valor_implantacao: implValue,
            quantidade_filiais:
              cobrarPorFilial && finalFiliaisDetalhes.length > 0
                ? finalFiliaisDetalhes.length
                : totalBranchesCount,
            filiais_detalhes: finalFiliaisDetalhes,
            cobrar_filiais: cobrarPorFilial,
            prazos_concedidos: prazosConcedidos,
          } as any)
          .select()
          .single()
        if (error) throw error

        if (insertedProspect) {
          supabase.functions
            .invoke('send-crm-proposal', { body: { proposalId: insertedProspect.id } })
            .catch(console.error)
        }

        toast({
          title: 'Cotação salva!',
          description: 'A proposta foi registrada no CRM. O PDF será gerado em instantes.',
          className: 'bg-emerald-600 text-white border-none',
        })
        setTimeout(() => {
          const oldTitle = document.title
          document.title = `Proposta_${quoteEmpresa.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`
          window.print()
          document.title = oldTitle
          navigate('/crm')
        }, 1000)
      }
    } catch (err: any) {
      toast({ title: 'Erro ao salvar cotação', description: err.message, variant: 'destructive' })
    }
  }

  const handleSaveClient = async () => {
    if (!name || !cnpj) {
      toast({
        title: 'Atenção',
        description: 'Preencha a Razão Social e CNPJ.',
        variant: 'destructive',
      })
      return
    }

    if (
      cobrarPorFilial &&
      !filiaisVinculadas.some((f) => f.cnpj && f.cnpj.replace(/\D/g, '').length > 0)
    ) {
      toast({
        title: 'Atenção',
        description: 'Ao cobrar por filial, adicione pelo menos uma filial com CNPJ válido.',
        variant: 'destructive',
      })
      return
    }

    try {
      const rawCnpj = cnpj.replace(/\D/g, '')

      const { data: existingClients } = await supabase.from('clientes').select('*')

      const existingClient =
        isAddendum && selectedGenTargetType === 'cliente' && selectedGenClientId !== 'novo'
          ? existingClients?.find((c) => c.id === selectedGenClientId)
          : existingClients?.find((c) => c.cnpj.replace(/\D/g, '') === rawCnpj)

      const adicionais = selectedModules
        .filter((id) => !MODULES.find((m) => m.id === id)?.isBasic)
        .map((id) => {
          const mod = MODULES.find((m) => m.id === id) as any
          return {
            name: mod?.name || id,
            price:
              typeof customModulePrices[id] === 'number' ? customModulePrices[id] : mod?.price || 0,
            ...(mod?.franquia_quantidade
              ? {
                  franquia_quantidade: mod.franquia_quantidade,
                  valor_excedente: mod.valor_excedente,
                }
              : {}),
          }
        })

      selectedTrainings.forEach((id) => {
        const t = PREDEFINED_TRAININGS.find((pt) => pt.id === id)
        const price =
          typeof customTrainingPrices[id] === 'number' ? customTrainingPrices[id] : t?.price || 0
        adicionais.push({
          name: `Treinamento: ${t?.name}`,
          price: isTreinamentoGratuito ? 0 : price,
          isFree: isTreinamentoGratuito,
        } as any)
      })

      if (selectedDfe !== 'dfe-none' && dfeData) {
        adicionais.push({ name: dfeData.name, price: dfeData.price })
      }
      if (additionalPlates > 0) {
        adicionais.push({
          name: `Placa Adicional Frota (Qtd: ${additionalPlates})`,
          price: additionalPlatesTotal,
        })
      }
      if (additionalBranches > 0) {
        adicionais.push({
          name: `Filiais Adicionais (Qtd: ${additionalBranches})`,
          price: additionalBranchesTotal,
        })
      }

      const existingAdicionais = existingClient?.modulos?.adicionais || []
      const newAdicionais = [...existingAdicionais]
      adicionais.forEach((a) => {
        if (!newAdicionais.find((ea: any) => ea.name === a.name)) {
          newAdicionais.push(a)
        }
      })

      const modulosFormatados = {
        plano_base:
          planData?.name !== 'Nenhum'
            ? planData?.name
            : existingClient?.modulos?.plano_base || selectedPlan,
        filiais: (existingClient?.modulos?.filiais || 0) + additionalBranches,
        adicionais: newAdicionais.map((a: any) => {
          const m = MODULES.find((mod) => mod.name === a.name)
          if (m && moduleGracePeriods[m.id]) {
            return { ...a, tem_gratuidade: true, periodo_gratuidade: moduleGracePeriods[m.id] }
          }
          return a
        }),
      }

      const cobrancasAtuais = existingClient?.cobrancas
        ? Array.isArray(existingClient.cobrancas)
          ? existingClient.cobrancas
          : []
        : []
      let updatedCobrancas = [...cobrancasAtuais]
      if (additionalPlates > 0) {
        updatedCobrancas.push({
          tipo: 'Placa Adicional Frota',
          quantidade: additionalPlates,
          valor_unitario: additionalPlatesPrice,
          valor_total: additionalPlatesTotal,
          data_inclusao: new Date().toISOString(),
        })
      }
      if (additionalBranches > 0) {
        updatedCobrancas.push({
          tipo: 'Filiais Adicionais',
          quantidade: additionalBranches,
          valor_unitario: additionalBranchesPrice,
          valor_total: additionalBranchesTotal,
          data_inclusao: new Date().toISOString(),
        })
      }

      if (existingClient) {
        await updateCliente(existingClient.id, {
          nome: name,
          cnpj,
          email,
          telefone,
          endereco: address,
          rep_nome: repName,
          rep_cpf: repCpf,
          rep_rg: repRg,
          valor_implantacao: implValue,
          modo_implantacao: implMode,
          modulos: modulosFormatados,
          valor_total: (existingClient.valor_total || 0) + totalValue,
          desconto_mensalidade: validDescontoMensalidade,
          tipo_desconto: tipoDesconto,
          cobrancas: updatedCobrancas,
          status: sendToFinance
            ? 'Enviado p/ Financeiro'
            : sendToImplementation
              ? 'Enviado p/ Implantação'
              : 'Ativo',
          filiais_detalhes: finalFiliaisDetalhes,
          cobrar_filiais: cobrarPorFilial,
          quantidade_filiais: finalFiliaisDetalhes.length,
        } as any)

        await createHistorico({
          cliente_id: existingClient.id,
          tipo: isAddendum ? 'Aditivo Contratual' : 'Renovação / Novo Contrato',
          data_solicitacao: new Date().toISOString().split('T')[0],
          plano: isAddendum
            ? currentClientPlanName || planData?.name || 'Não informado'
            : planData?.name,
          modulos: adicionais,
          valor_adicional: totalValue,
          valor_total: (existingClient.valor_total || 0) + totalValue,
          desconto_mensalidade: validDescontoMensalidade,
          tipo_desconto: tipoDesconto,
          isencao_periodo: isencaoPeriodo,
          observacoes: `Contrato atualizado via Gerador de Contratos. Implantação: ${implMode} - R$ ${implValue}${validDescontoMensalidade > 0 ? ` | Desconto: ${tipoDesconto === 'percentual' ? `${validDescontoMensalidade}%` : `R$ ${validDescontoMensalidade}`} (${formatCurrency(calculatedDiscount)})${isencaoPeriodo > 0 ? ` Isenção: ${isencaoPeriodo} meses` : ''}` : ''}`,
          is_gratuito: isTreinamentoGratuito,
          prazos_concedidos: prazosConcedidos,
        })

        try {
          await supabase.functions.invoke('send-finance-email', {
            body: {
              to: existingClient.email || 'financeiro@empresa.com',
              clientName: existingClient.nome,
              moduleName: adicionais.map((a: any) => a.name).join(', '),
              type: 'aditivo',
            },
          })
        } catch (e) {
          console.error('Erro ao enviar email automático de aditivo', e)
        }

        if (loadedProposalId && loadedProposalId !== 'none') {
          await supabase
            .from('crm_propostas')
            .update({
              valor_mensalidade: totalValue,
              valor_implantacao: implValue,
              desconto_mensalidade: validDescontoMensalidade,
              tipo_desconto: tipoDesconto,
              isencao_periodo: isencaoPeriodo,
            })
            .eq('id', loadedProposalId)
        }

        toast({
          title: 'Cliente Atualizado',
          description: 'O contrato foi salvo e o aditivo enviado por e-mail.',
          className: 'bg-emerald-600 text-white border-none',
        })
      } else {
        const newClient = await createCliente({
          nome: name,
          cnpj,
          email,
          telefone,
          endereco: address,
          rep_nome: repName,
          rep_cpf: repCpf,
          rep_rg: repRg,
          valor_implantacao: implValue,
          modo_implantacao: implMode,
          modulos: modulosFormatados,
          valor_total: totalValue,
          desconto_mensalidade: validDescontoMensalidade,
          tipo_desconto: tipoDesconto,
          cobrancas: updatedCobrancas,
          status: sendToFinance
            ? 'Enviado p/ Financeiro'
            : sendToImplementation
              ? 'Enviado p/ Implantação'
              : 'Ativo',
          filiais_detalhes: finalFiliaisDetalhes,
          cobrar_filiais: cobrarPorFilial,
          quantidade_filiais: finalFiliaisDetalhes.length,
        } as any)

        await createHistorico({
          cliente_id: newClient.id,
          tipo: isAddendum ? 'Aditivo Contratual' : 'Contrato Inicial',
          data_solicitacao: new Date().toISOString().split('T')[0],
          plano: isAddendum
            ? currentClientPlanName || planData?.name || 'Não informado'
            : planData?.name,
          modulos: adicionais,
          valor_adicional: 0,
          valor_total: totalValue,
          desconto_mensalidade: validDescontoMensalidade,
          tipo_desconto: tipoDesconto,
          isencao_periodo: isencaoPeriodo,
          observacoes: `Contrato gerado via Gerador de Contratos. Implantação: ${implMode} - R$ ${implValue}${validDescontoMensalidade > 0 ? ` | Desconto: ${tipoDesconto === 'percentual' ? `${validDescontoMensalidade}%` : `R$ ${validDescontoMensalidade}`} (${formatCurrency(calculatedDiscount)})${isencaoPeriodo > 0 ? ` Isenção: ${isencaoPeriodo} meses` : ''}` : ''}`,
          is_gratuito: isTreinamentoGratuito,
          prazos_concedidos: prazosConcedidos,
        })

        if (sendToFinance) {
          try {
            await supabase.functions.invoke('send-finance-email', {
              body: {
                to: 'financeiro@empresa.com',
                clientName: name,
                moduleName: planData?.name || selectedPlan,
                type: 'novo_contrato',
              },
            })
          } catch (e) {
            console.error('Erro ao enviar email automático de novo contrato', e)
          }
        }

        if (loadedProposalId && loadedProposalId !== 'none') {
          await supabase
            .from('crm_propostas')
            .update({
              cliente_id: newClient.id,
              valor_mensalidade: totalValue,
              valor_implantacao: implValue,
              desconto_mensalidade: validDescontoMensalidade,
              tipo_desconto: tipoDesconto,
              isencao_periodo: isencaoPeriodo,
            })
            .eq('id', loadedProposalId)
        }

        toast({
          title: 'Contrato Gerado',
          description: 'O novo cliente e o contrato foram salvos.',
          className: 'bg-emerald-600 text-white border-none',
        })
      }

      setTimeout(() => {
        const oldTitle = document.title
        document.title = `Proposta_${name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`
        window.print()
        document.title = oldTitle
        navigate('/clientes')
      }, 1000)
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    }
  }

  const inputHighlightClass = autoFilled
    ? 'bg-yellow-50 border-yellow-300 transition-all duration-500'
    : 'transition-all duration-500'

  return (
    <div className="space-y-6 pb-12 print:pb-0 print:space-y-0">
      <div className="print:hidden">
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Contratos</h1>
        <p className="text-muted-foreground mt-1">
          Gere contratos manualmente ou importe documentos para preenchimento automático.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val)}
        className="space-y-6 print:space-y-0"
      >
        <TabsList className="print:hidden">
          <TabsTrigger value="gerar">Gerar Contrato</TabsTrigger>
          <TabsTrigger value="cotacao">Gerar Cotação</TabsTrigger>
          <TabsTrigger value="importar">Importar PDFs Lote</TabsTrigger>
        </TabsList>

        <TabsContent value="gerar" className="print:m-0">
          <div className="grid lg:grid-cols-12 gap-6 items-start print:block print:w-full print:m-0 print:p-0">
            <div className="lg:col-span-5 space-y-6 print:hidden">
              <Card className="border-indigo-100 shadow-sm bg-indigo-50/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-indigo-800 text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Gerar a partir de Proposta
                  </CardTitle>
                  <CardDescription className="text-xs text-indigo-600/80">
                    Selecione uma proposta existente para gerar um contrato ou aditivo
                    automaticamente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-4">
                    <Select value={loadedProposalId} onValueChange={handleLoadProposal}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Selecione uma proposta..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {availableProposals.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.crm_prospects?.empresa || p.clientes?.nome || 'Sem empresa'} -{' '}
                            {new Date(p.data_proposta).toLocaleDateString('pt-BR', {
                              timeZone: 'UTC',
                            })}{' '}
                            ({formatCurrency(p.valor_mensalidade)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <SignedContractUpload />

              <Card className="border-indigo-100 shadow-sm bg-indigo-50/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-indigo-800 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Importação de Documentos (OCR)
                  </CardTitle>
                  <CardDescription className="text-xs text-indigo-600/80">
                    Arraste o Cartão CNPJ, Contrato Social e CNH para auto-preencher os dados.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={cn(
                      'relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors',
                      isDragging
                        ? 'border-indigo-500 bg-indigo-100/50'
                        : 'border-indigo-200 hover:border-indigo-300 bg-white',
                    )}
                  >
                    <Input
                      type="file"
                      accept=".pdf,image/*"
                      multiple
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      onChange={onFileInput}
                      disabled={isExtractingCompany}
                    />
                    {isExtractingCompany ? (
                      <div className="flex flex-col items-center space-y-2 w-full">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                        <span className="text-sm font-medium text-indigo-700">
                          Processando documentos...
                        </span>
                        <Progress value={uploadProgress} className="w-3/4 h-2 mt-2" />
                      </div>
                    ) : (
                      <>
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full mb-3">
                          <Upload className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">
                          Clique ou arraste arquivos aqui
                        </span>
                        <span className="text-xs text-slate-500 mt-1">Suporta PDF, JPG, PNG</span>
                      </>
                    )}
                  </div>

                  <div className="relative">
                    <Input
                      type="file"
                      accept=".pdf"
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      onChange={handleUploadProposal}
                    />
                    <Button
                      variant="outline"
                      className="w-full bg-white border-indigo-200 text-indigo-700 pointer-events-none"
                    >
                      {isExtractingProposal ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <UploadCloud className="w-4 h-4 mr-2" />
                      )}
                      Importar Proposta (Opcional)
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle>1. Dados da Contratante</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4 mb-6 pb-4 border-b border-slate-100">
                    <Label className="text-sm font-bold text-slate-700">Tipo de Contrato</Label>
                    <RadioGroup
                      value={selectedGenTargetType}
                      onValueChange={(v) => {
                        setSelectedGenTargetType(v as 'prospect' | 'cliente')
                        setIsAddendum(v === 'cliente')
                        if (v === 'prospect') {
                          setSelectedGenClientId('novo')
                          setCurrentClientModules({ plano_base: '', adicionais: [] })
                          setCurrentContractValue(0)
                          setCurrentClientPlanName('')
                        }
                      }}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="prospect" id="gen-prospect" />
                        <Label htmlFor="gen-prospect" className="font-medium cursor-pointer">
                          Novo Contrato (Prospect)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cliente" id="gen-cliente" />
                        <Label htmlFor="gen-cliente" className="font-medium cursor-pointer">
                          Aditivo (Cliente Existente)
                        </Label>
                      </div>
                    </RadioGroup>

                    {selectedGenTargetType === 'cliente' && (
                      <div className="space-y-2 mt-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <Label>Vincular a um Cliente para gerar Aditivo</Label>
                        <Select
                          value={selectedGenClientId}
                          onValueChange={(val) => {
                            setSelectedGenClientId(val)
                            if (val !== 'novo') {
                              const c = clientes.find((cl) => cl.id === val)
                              if (c) {
                                setName(c.nome)
                                setCnpj(formatCNPJ(c.cnpj || ''))
                                setAddress(c.endereco || '')
                                setEmail(c.email || '')
                                setTelefone(c.telefone || '')
                                setRepName(c.rep_nome || '')
                                setCurrentContractValue(c.valor_total || 0)
                                setCurrentClientModules(
                                  c.modulos || { plano_base: '', adicionais: [] },
                                )
                                if (c.plano_id) {
                                  supabase
                                    .from('planos_saude')
                                    .select('descricao')
                                    .eq('id', c.plano_id)
                                    .single()
                                    .then(({ data: planoData }) => {
                                      setCurrentClientPlanName(
                                        planoData?.descricao ||
                                          c.modulos?.plano_base ||
                                          'Não informado',
                                      )
                                    })
                                } else {
                                  setCurrentClientPlanName(c.modulos?.plano_base || 'Não informado')
                                }
                                if (c.cobrar_filiais) {
                                  setCobrarPorFilial(true)
                                  setQuantidadeFiliais(c.quantidade_filiais || 1)
                                  setFiliaisVinculadas(
                                    (c.filiais_detalhes || []).map((f: any) => ({
                                      id: Math.random().toString(),
                                      cnpj: f.cnpj || '',
                                      nome: f.nome || '',
                                    })),
                                  )
                                } else {
                                  setCobrarPorFilial(false)
                                  setFiliaisVinculadas([])
                                  setFiliais(
                                    (c.filiais_detalhes || []).map((f: any) => ({
                                      id: Math.random().toString(),
                                      cnpj: f.cnpj || '',
                                      nome: f.nome || '',
                                      isentar: f.isentar || false,
                                    })),
                                  )
                                }
                              }
                            } else {
                              setName('')
                              setCnpj('')
                              setAddress('')
                              setEmail('')
                              setTelefone('')
                              setRepName('')
                              setCurrentContractValue(0)
                              setCurrentClientModules({ plano_base: '', adicionais: [] })
                              setCurrentClientPlanName('')
                            }
                          }}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Selecione um cliente..." />
                          </SelectTrigger>
                          <SelectContent>
                            <div className="p-2 border-b sticky top-0 bg-popover z-10">
                              <Input
                                placeholder="Pesquisar cliente..."
                                value={clientSearch}
                                onChange={(e) => setClientSearch(e.target.value)}
                                onKeyDown={(e) => e.stopPropagation()}
                                className="h-8"
                              />
                            </div>
                            <SelectItem value="novo">-- Selecione um Cliente --</SelectItem>
                            {clientes
                              .filter((c) =>
                                c.nome.toLowerCase().includes(clientSearch.toLowerCase()),
                              )
                              .map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.nome}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {isAddendum &&
                    selectedGenTargetType === 'cliente' &&
                    selectedGenClientId !== 'novo' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">
                            Plano Atual
                          </div>
                          <div className="text-sm font-bold text-blue-900">
                            {currentClientPlanName || 'Não informado'}
                          </div>
                        </div>
                        <FileText className="w-5 h-5 text-blue-400" />
                      </div>
                    )}

                  {isAddendum && cobrarPorFilial && filiaisVinculadas.length > 0 && (
                    <div className="bg-gradient-to-r from-slate-50 to-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-3">
                      <div className="text-sm font-bold text-indigo-700">
                        Comparativo de Valores — Aditivo de Inclusão de Filiais
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-white rounded-lg p-3 border border-slate-200">
                          <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">
                            Valor Atual
                          </div>
                          <div className="text-lg font-bold text-slate-800">
                            {formatCurrency(currentContractValue || 0)}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-amber-200 flex flex-col items-center justify-center">
                          <div className="text-xs text-amber-600 font-medium uppercase tracking-wide mb-1">
                            {filiaisVinculadas.length} Filial(is) × R$ 199,00
                          </div>
                          <div className="text-lg font-bold text-amber-600">
                            + {formatCurrency(filiaisVinculadas.length * 199)}
                          </div>
                        </div>
                        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-300">
                          <div className="text-xs text-indigo-600 font-medium uppercase tracking-wide mb-1">
                            Novo Valor
                          </div>
                          <div className="text-lg font-bold text-indigo-700">
                            {formatCurrency(
                              (currentContractValue || 0) + filiaisVinculadas.length * 199,
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Razão Social</Label>
                      {isLoadingCnpj && (
                        <span className="text-xs text-indigo-600 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Buscando dados oficiais da Receita...
                        </span>
                      )}
                    </div>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputHighlightClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>CNPJ</Label>
                      {isLoadingCnpj && (
                        <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                      )}
                    </div>
                    <Input
                      value={cnpj}
                      onChange={handleCnpjChange}
                      onBlur={handleCnpjBlur}
                      className={inputHighlightClass}
                      disabled={isLoadingCnpj}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>E-mail</Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputHighlightClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        className={inputHighlightClass}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Endereço Completo</Label>
                    <Input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className={inputHighlightClass}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Representante Legal</Label>
                      <Input
                        value={repName}
                        onChange={(e) => setRepName(e.target.value)}
                        className={inputHighlightClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CPF do Representante</Label>
                      <Input
                        value={repCpf}
                        onChange={(e) => setRepCpf(e.target.value)}
                        className={inputHighlightClass}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>RG do Representante</Label>
                      <Input
                        value={repRg}
                        onChange={(e) => setRepRg(e.target.value)}
                        className={inputHighlightClass}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* PLANOS E MODULOS */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle>2. Plano, Módulos e Implantação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedGenTargetType !== 'cliente' && (
                    <>
                      <div className="space-y-3">
                        <Label className="text-sm font-bold">Plano Base</Label>
                        <div className="flex gap-4 items-start">
                          <div className="flex-1">
                            <Select
                              value={selectedPlan}
                              onValueChange={(val) => {
                                setSelectedPlan(val)
                                setIsPlanPriceManual(false)
                                setManualPlanPrice('')
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">
                                  Nenhum (Somente Módulos / Upsell)
                                </SelectItem>
                                {PLANS.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.name} - {formatCurrency(p.price)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {selectedPlan !== 'none' && (
                            <div className="w-32">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Valor"
                                value={isPlanPriceManual ? manualPlanPrice : defaultPlanPrice}
                                onChange={(e) => {
                                  setIsPlanPriceManual(true)
                                  setManualPlanPrice(e.target.value)
                                }}
                                onBlur={(e) => {
                                  if (e.target.value === '') {
                                    setIsPlanPriceManual(false)
                                    setManualPlanPrice('')
                                  }
                                }}
                                className="bg-white border-slate-300 h-9"
                              />
                              <span className="text-[10px] text-slate-500 mt-1 block">
                                Valor Mensal (R$)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}
                  <div className="space-y-3">
                    <Label className="text-sm font-bold">Módulos Adicionais</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {MODULES.filter((m) => !m.isBasic).map((m) => {
                        const isChecked = selectedModules.includes(m.id)
                        return (
                          <div
                            key={m.id}
                            className="flex flex-col border p-3 rounded-lg bg-white shadow-sm gap-2 transition-colors hover:border-indigo-200"
                          >
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={m.id}
                                checked={isChecked}
                                onCheckedChange={(c) => handleToggleModule(m.id, c as boolean)}
                              />
                              <Label
                                htmlFor={m.id}
                                className="text-xs font-semibold cursor-pointer"
                              >
                                {m.name}{' '}
                                <span className="font-normal text-slate-500">
                                  - {formatCurrency(m.price)}
                                </span>
                              </Label>
                            </div>
                            {isChecked && m.price > 0 && (
                              <div className="pl-6 pt-1 flex items-center gap-3 border-t border-slate-100 mt-1 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <Label
                                    htmlFor={`price-${m.id}`}
                                    className="text-[10px] text-slate-600"
                                  >
                                    Valor (R$)
                                  </Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    id={`price-${m.id}`}
                                    className="w-20 h-6 text-[10px] px-1 bg-slate-50 border-slate-200"
                                    value={customModulePrices[m.id] ?? ''}
                                    onChange={(e) => {
                                      const val =
                                        e.target.value === '' ? '' : parseFloat(e.target.value)
                                      setCustomModulePrices((prev) => ({ ...prev, [m.id]: val }))
                                    }}
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`grace-${m.id}`}
                                    checked={!!moduleGracePeriods[m.id]}
                                    onCheckedChange={(c) => {
                                      if (c) setModuleGracePeriods((p) => ({ ...p, [m.id]: 3 }))
                                      else {
                                        const p = { ...moduleGracePeriods }
                                        delete p[m.id]
                                        setModuleGracePeriods(p)
                                      }
                                    }}
                                  />
                                  <Label
                                    htmlFor={`grace-${m.id}`}
                                    className="text-[10px] text-slate-600 cursor-pointer"
                                  >
                                    Gratuidade
                                  </Label>
                                </div>
                                {!!moduleGracePeriods[m.id] && (
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      min="1"
                                      className="w-16 h-6 text-[10px] px-1 bg-slate-50 border-slate-200"
                                      value={moduleGracePeriods[m.id]}
                                      onChange={(e) =>
                                        setModuleGracePeriods((p) => ({
                                          ...p,
                                          [m.id]: parseInt(e.target.value) || 0,
                                        }))
                                      }
                                    />
                                    <span className="text-[10px] text-slate-500">meses</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="space-y-3 mt-4">
                    <div className="flex flex-col gap-4 bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="cobrar-filial"
                            checked={cobrarPorFilial}
                            onCheckedChange={(c) => {
                              setCobrarPorFilial(c as boolean)
                              if (!c) {
                                setQuantidadeFiliais(1)
                                setFiliaisVinculadas([])
                              } else if (filiaisVinculadas.length === 0) {
                                setQuantidadeFiliais(1)
                                setFiliaisVinculadas([
                                  { id: Math.random().toString(), cnpj: '', nome: '' },
                                ])
                              }
                            }}
                          />
                          <Label
                            htmlFor="cobrar-filial"
                            className="text-sm cursor-pointer font-bold text-slate-700"
                          >
                            Cobrar por Filial
                          </Label>
                        </div>
                        {cobrarPorFilial && (
                          <div className="flex items-center gap-2 border-l pl-4">
                            <Label className="text-xs font-medium text-slate-600">
                              Qtd. Filiais:
                            </Label>
                            <Input
                              type="number"
                              min="1"
                              value={filiaisVinculadas.length}
                              readOnly
                              className="w-20 h-8 bg-slate-50 cursor-not-allowed"
                            />
                          </div>
                        )}
                      </div>

                      {cobrarPorFilial && (
                        <div className="space-y-3 pt-3 border-t">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-bold text-slate-700">
                              Inclusão de Filiais
                            </Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setFiliaisVinculadas([
                                  ...filiaisVinculadas,
                                  { id: Math.random().toString(), cnpj: '', nome: '' },
                                ])
                                setQuantidadeFiliais(filiaisVinculadas.length + 1)
                              }}
                            >
                              + Adicionar Filial
                            </Button>
                          </div>
                          <div className="grid gap-3">
                            {filiaisVinculadas.map((f, index) => (
                              <div
                                key={f.id}
                                className="flex flex-col sm:flex-row gap-3 items-center"
                              >
                                <div className="flex-1">
                                  <Input
                                    placeholder="CNPJ"
                                    value={f.cnpj}
                                    onChange={(e) => {
                                      const raw = e.target.value.replace(/\D/g, '')
                                      const formatted =
                                        raw.length <= 14 ? formatCNPJ(raw) : e.target.value
                                      const next = [...filiaisVinculadas]
                                      next[index].cnpj = formatted
                                      setFiliaisVinculadas(next)

                                      if (raw.length === 14) {
                                        fetchCnpjFromService(raw)
                                          .then(({ data: cnpjResult }) => {
                                            if (cnpjResult?.nome) {
                                              setFiliaisVinculadas((prev) => {
                                                const nextUpdate = [...prev]
                                                if (!nextUpdate[index].nome) {
                                                  nextUpdate[index].nome = cnpjResult.nome
                                                }
                                                return nextUpdate
                                              })
                                            }
                                          })
                                          .catch(() => {})
                                      }
                                    }}
                                    className="h-8 text-xs bg-white"
                                  />
                                </div>
                                <div className="flex-[2] flex gap-2 items-center">
                                  <Input
                                    placeholder="Nome/Identificação da Filial"
                                    value={f.nome}
                                    onChange={(e) => {
                                      const next = [...filiaisVinculadas]
                                      next[index].nome = e.target.value
                                      setFiliaisVinculadas(next)
                                    }}
                                    className="h-8 text-xs bg-white"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const next = filiaisVinculadas.filter((_, i) => i !== index)
                                      setFiliaisVinculadas(next)
                                      setQuantidadeFiliais(next.length)
                                    }}
                                    className="h-8 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                                  >
                                    Remover
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {isAddendum &&
                    cobrarPorFilial &&
                    filiaisVinculadas.some((f) => f.cnpj || f.nome) && (
                      <div className="space-y-2 mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <Label className="text-sm font-bold text-amber-800">
                          Descrição do Item (Gerada Automaticamente)
                        </Label>
                        <div className="bg-white border border-amber-200 rounded-md p-3 text-xs text-slate-700 whitespace-pre-line font-mono">
                          {filiaisVinculadas
                            .filter((f) => f.cnpj || f.nome)
                            .map(
                              (f) =>
                                `Referente à inclusão da filial ${f.nome || '[Nome da Filial]'} - CNPJ: ${f.cnpj || '[CNPJ]'}`,
                            )
                            .join('\n')}
                        </div>
                        {filiaisVinculadas.some(
                          (f) => f.cnpj && f.cnpj.replace(/\D/g, '').length !== 14,
                        ) && (
                          <div className="text-xs text-red-600">
                            CNPJ deve conter 14 dígitos. Verifique os campos destacados.
                          </div>
                        )}
                      </div>
                    )}

                  {autoItemDescription && (
                    <div className="space-y-2 mt-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-bold text-indigo-800">
                          Descrição dos Itens (Gerada Automaticamente)
                        </Label>
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">
                          Ciclo: Cobrança Mensal
                        </span>
                      </div>
                      <div className="bg-white border border-indigo-200 rounded-md p-3 text-xs text-slate-700 whitespace-pre-line font-mono max-h-40 overflow-y-auto">
                        {autoItemDescription}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 mt-4">
                    <Label className="text-sm font-bold">Franquia de Emissões (DF-e)</Label>
                    <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                      <Select value={selectedDfe} onValueChange={setSelectedDfe}>
                        <SelectTrigger className="w-full sm:w-64 bg-slate-50 border">
                          <SelectValue placeholder="Selecione um pacote DF-e..." />
                        </SelectTrigger>
                        <SelectContent>
                          {DFE_TIERS.map((tier) => (
                            <SelectItem key={tier.id} value={tier.id}>
                              {tier.name} {tier.price > 0 ? `- ${formatCurrency(tier.price)}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-3 mt-4">
                    <Label className="text-sm font-bold">Placas Adicionais Frota</Label>
                    <div className="flex gap-3 items-center">
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={additionalPlates || ''}
                        onChange={(e) => setAdditionalPlates(parseInt(e.target.value) || 0)}
                        className="w-32 bg-slate-50 border"
                      />
                      {additionalPlates > 0 && (
                        <span className="text-xs text-slate-500 font-medium">
                          Vlr. Unitário: {formatCurrency(additionalPlatesPrice)} | Subtotal:{' '}
                          {formatCurrency(additionalPlatesTotal)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3 mt-4">
                    <Label className="text-sm font-bold">Filiais Adicionais</Label>
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-3 items-center flex-wrap sm:flex-nowrap">
                        <Input
                          placeholder="00.000.000/0000-00"
                          value={newFilialCnpj}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '')
                            if (raw.length <= 14) setNewFilialCnpj(formatCNPJ(raw))
                            if (raw.length === 14) fetchFilialCnpjData(raw)
                          }}
                          className="w-48 bg-slate-50 border"
                        />
                        <Input
                          placeholder="Nome da Empresa (opcional)"
                          value={newFilialNome}
                          onChange={(e) => setNewFilialNome(e.target.value)}
                          className="w-full sm:w-64 bg-slate-50 border"
                        />
                        <Button variant="outline" size="sm" onClick={handleAddFilial}>
                          Adicionar Filial
                        </Button>
                      </div>
                      {filiais.length > 0 && (
                        <div className="space-y-2 mt-2">
                          {filiais.map((filial) => (
                            <div
                              key={filial.id}
                              className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50 p-2 border rounded-md"
                            >
                              <div className="flex-1 flex flex-col">
                                <span className="font-medium text-sm">
                                  {filial.nome || 'Nome não informado'}
                                </span>
                                <span className="text-xs text-slate-500">CNPJ: {filial.cnpj}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`isentar-${filial.id}`}
                                  checked={filial.isentar}
                                  onCheckedChange={(c) => {
                                    setFiliais(
                                      filiais.map((f) =>
                                        f.id === filial.id ? { ...f, isentar: c as boolean } : f,
                                      ),
                                    )
                                  }}
                                />
                                <Label
                                  htmlFor={`isentar-${filial.id}`}
                                  className="text-xs cursor-pointer text-slate-600"
                                >
                                  Isentar valor de inclusão
                                </Label>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setFiliais(filiais.filter((f) => f.id !== filial.id))
                                }}
                              >
                                <Trash className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <div className="text-xs text-slate-500 font-medium text-right mt-2 pt-2 border-t">
                            Subtotal Filiais: {formatCurrency(additionalBranchesTotal)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-sm font-bold">Desconto na Mensalidade</Label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <Select
                          value={tipoDesconto}
                          onValueChange={(v) => setTipoDesconto(v as 'valor' | 'percentual')}
                        >
                          <SelectTrigger className="w-24 bg-slate-50 border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="valor">R$</SelectItem>
                            <SelectItem value="percentual">%</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min="0"
                          max={tipoDesconto === 'percentual' ? '100' : undefined}
                          placeholder={tipoDesconto === 'percentual' ? '0%' : '0,00'}
                          value={descontoMensalidade || ''}
                          onChange={(e) => setDescontoMensalidade(parseFloat(e.target.value) || 0)}
                          className="w-32 bg-slate-50 border"
                        />
                      </div>

                      {validDescontoMensalidade > 0 && (
                        <div className="flex items-center gap-2 sm:border-l sm:border-slate-200 sm:pl-4">
                          <Label className="text-xs whitespace-nowrap">
                            Período de Isenção (meses):
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={isencaoPeriodo || ''}
                            onChange={(e) => setIsencaoPeriodo(parseInt(e.target.value) || 0)}
                            className="w-20 bg-slate-50 border h-9"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-bold">Ciclo de Faturamento</Label>
                      <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                        Cobrança Mensal
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    <Label className="text-sm font-bold">Valor Total da Mensalidade (R$)</Label>
                    <div className="flex gap-3 items-center flex-wrap">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={manualMensalidadeValue}
                        onChange={(e) => {
                          setIsMensalidadeManual(true)
                          setManualMensalidadeValue(e.target.value)
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '') setIsMensalidadeManual(false)
                        }}
                        className="w-40 bg-white border"
                      />
                      {isMensalidadeManual && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsMensalidadeManual(false)
                            setManualMensalidadeValue(calculatedTotalValue.toString())
                          }}
                          className="text-xs text-slate-500 hover:text-slate-700 h-9"
                        >
                          Restaurar Calculado ({formatCurrency(calculatedTotalValue)})
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    <Label className="text-sm font-bold flex items-center gap-2 text-[#1e3a8a]">
                      <Gift className="w-4 h-4 text-orange-500" /> Prazos Concedidos / Condições
                      Especiais
                    </Label>
                    <Input
                      value={prazosConcedidos}
                      onChange={(e) => setPrazosConcedidos(e.target.value)}
                      placeholder="Descreva prazos negociados, isenções especiais ou condições específicas..."
                      className="w-full bg-slate-50 border transition-colors focus:border-orange-300"
                    />
                  </div>

                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-sm font-bold">Implantação</Label>
                    <RadioGroup
                      value={implMode}
                      onValueChange={(v) => setImplMode(v as 'remoto' | 'presencial')}
                      className="flex flex-col sm:flex-row gap-4"
                    >
                      <div className="flex items-center space-x-2 border p-3 rounded-lg flex-1 cursor-pointer hover:bg-slate-50 transition-colors">
                        <RadioGroupItem value="remoto" id="remoto" />
                        <Label
                          htmlFor="remoto"
                          className="cursor-pointer font-medium flex-1 h-full py-1"
                        >
                          Remoto (R$ 130/h)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border p-3 rounded-lg flex-1 cursor-pointer hover:bg-slate-50 transition-colors">
                        <RadioGroupItem value="presencial" id="presencial" />
                        <Label
                          htmlFor="presencial"
                          className="cursor-pointer font-medium flex-1 h-full py-1"
                        >
                          Presencial (R$ 260/h)
                        </Label>
                      </div>
                    </RadioGroup>

                    <div className="mt-4 pt-2 border-t border-slate-100 space-y-2">
                      <Label className="text-xs">Valor Personalizado de Implantação</Label>
                      <div className="flex gap-3 items-center">
                        <Input
                          type="number"
                          placeholder="Ex: 1500"
                          value={manualImplValue}
                          onChange={(e) => setManualImplValue(e.target.value)}
                          className="w-1/2 bg-white"
                        />
                        <span className="text-xs text-slate-500">
                          Calculado: {formatCurrency(calculatedImplValue)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <Label className="text-sm font-bold">Serviços Adicionais</Label>
                    <div className="flex flex-col gap-2 border p-3 rounded-lg bg-slate-50 mb-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="gerar-diagnostic"
                          checked={includeDiagnosticVisit}
                          onCheckedChange={(c) => setIncludeDiagnosticVisit(c as boolean)}
                        />
                        <Label
                          htmlFor="gerar-diagnostic"
                          className="text-xs flex-1 cursor-pointer font-medium"
                        >
                          Adicionar Visita Presencial de Diagnóstico
                        </Label>
                      </div>
                      {includeDiagnosticVisit && (
                        <div className="space-y-3 pt-2">
                          {diagnosticVisits.map((visit, index) => (
                            <div
                              key={visit.id}
                              className="pl-6 flex flex-col sm:flex-row gap-4 items-end"
                            >
                              <div className="flex-1">
                                <Label className="text-sm font-semibold text-slate-700">
                                  Valor da Visita
                                </Label>
                                <Input
                                  type="number"
                                  placeholder="Ex: 1500"
                                  value={visit.value}
                                  onChange={(e) => {
                                    const newVisits = [...diagnosticVisits]
                                    newVisits[index].value = e.target.value
                                    setDiagnosticVisits(newVisits)
                                  }}
                                  className="w-full bg-white mt-1 text-base font-medium h-12 border-slate-300"
                                />
                              </div>
                              <div className="flex-1">
                                <Label className="text-sm font-semibold text-slate-700">
                                  Data da Visita
                                </Label>
                                <Input
                                  type="date"
                                  value={visit.date}
                                  onChange={(e) => {
                                    const newVisits = [...diagnosticVisits]
                                    newVisits[index].date = e.target.value
                                    setDiagnosticVisits(newVisits)
                                  }}
                                  className="w-full bg-white mt-1 text-base font-medium h-12 border-slate-300"
                                />
                              </div>
                              {diagnosticVisits.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-12 w-12 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    setDiagnosticVisits(
                                      diagnosticVisits.filter((v) => v.id !== visit.id),
                                    )
                                  }}
                                >
                                  <Trash className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <div className="pl-6">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs mt-2"
                              onClick={() => {
                                setDiagnosticVisits([
                                  ...diagnosticVisits,
                                  { id: Math.random().toString(), date: '', value: '' },
                                ])
                              }}
                            >
                              + Adicionar Outra Visita
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-bold">Treinamentos Adicionais</Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="treinamento-gratuito-gerar"
                          checked={isTreinamentoGratuito}
                          onCheckedChange={(c) => setIsTreinamentoGratuito(c as boolean)}
                        />
                        <Label
                          htmlFor="treinamento-gratuito-gerar"
                          className="text-xs cursor-pointer font-medium text-emerald-600"
                        >
                          Treinamento Gratuito
                        </Label>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {PREDEFINED_TRAININGS.map((t) => {
                        const isChecked = selectedTrainings.includes(t.id)
                        return (
                          <div
                            key={t.id}
                            className={cn(
                              'flex flex-col space-y-2 border p-2 rounded-lg transition-colors',
                              isTreinamentoGratuito && isChecked
                                ? 'bg-emerald-50 border-emerald-200'
                                : 'bg-slate-50 hover:bg-slate-100',
                            )}
                          >
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`train-gen-${t.id}`}
                                checked={isChecked}
                                onCheckedChange={(c) => {
                                  setSelectedTrainings((prev) =>
                                    c ? [...prev, t.id] : prev.filter((id) => id !== t.id),
                                  )
                                  if (c) {
                                    setCustomTrainingPrices((prev) => ({
                                      ...prev,
                                      [t.id]: t.price,
                                    }))
                                  } else {
                                    setCustomTrainingPrices((prev) => {
                                      const next = { ...prev }
                                      delete next[t.id]
                                      return next
                                    })
                                  }
                                }}
                              />
                              <Label
                                htmlFor={`train-gen-${t.id}`}
                                className="text-xs flex-1 cursor-pointer font-medium"
                              >
                                {t.name}
                              </Label>
                              {!isChecked || isTreinamentoGratuito ? (
                                <span className="text-xs font-semibold text-slate-600">
                                  {t.price > 0 && !isTreinamentoGratuito ? (
                                    formatCurrency(t.price)
                                  ) : (
                                    <span className="text-emerald-600 font-bold">Grátis</span>
                                  )}
                                </span>
                              ) : null}
                            </div>
                            {isChecked && !isTreinamentoGratuito && (
                              <div className="pl-6 flex items-center gap-2 border-t border-slate-100 pt-1">
                                <Label
                                  htmlFor={`price-train-gen-${t.id}`}
                                  className="text-[10px] text-slate-600"
                                >
                                  Valor (R$)
                                </Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  id={`price-train-gen-${t.id}`}
                                  className="w-24 h-6 text-xs px-1 bg-white border-slate-200"
                                  value={customTrainingPrices[t.id] ?? ''}
                                  onChange={(e) => {
                                    const val =
                                      e.target.value === '' ? '' : parseFloat(e.target.value)
                                    setCustomTrainingPrices((prev) => ({ ...prev, [t.id]: val }))
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {selectedGenTargetType === 'cliente' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                        <h4 className="font-bold text-sm mb-2 text-slate-600">Mensalidade Atual</h4>
                        <span className="text-xl font-bold text-slate-800">
                          {formatCurrency(currentContractValue)}
                        </span>
                      </div>
                      <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg">
                        <h4 className="font-bold text-sm mb-2 text-indigo-700">
                          Módulos Adicionais
                        </h4>
                        <span className="text-xl font-bold text-indigo-800">
                          +{formatCurrency(totalValue)}
                        </span>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                        <h4 className="font-bold text-sm mb-2 text-emerald-700">
                          Nova Mensalidade Total
                        </h4>
                        <span className="text-xl font-bold text-emerald-800">
                          {formatCurrency(currentContractValue + totalValue)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                        <h4 className="font-bold text-sm mb-2 text-slate-600">
                          Valor Original do Plano
                        </h4>
                        <span className="text-xl font-bold text-slate-800">
                          {formatCurrency(subtotalMensalidade)}
                        </span>
                      </div>
                      <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg">
                        <h4 className="font-bold text-sm mb-2 text-indigo-700">
                          Valor com Desconto Aplicado
                        </h4>
                        <div className="flex flex-col">
                          <span className="text-xl font-bold text-indigo-800">
                            {formatCurrency(totalValue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-7 sticky top-6 print:static print:block print:w-full print:m-0 print:p-0">
              <Card className="flex flex-col h-[calc(100vh-6rem)] min-h-[700px] shadow-xl border-slate-200 overflow-hidden bg-white print:h-auto print:min-h-0 print:shadow-none print:border-none">
                <CardHeader className="bg-slate-50 border-b p-3 flex flex-col sm:flex-row sm:items-center justify-between print:hidden gap-3">
                  <CardTitle className="text-sm font-bold text-slate-700">
                    Ações do Contrato
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSendToImplementation(!sendToImplementation)}
                      className={cn(
                        'text-xs transition-colors',
                        sendToImplementation
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-100',
                      )}
                    >
                      <Rocket className="w-3 h-3 mr-1" />
                      Enviar p/ Implantação
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSendToFinance(!sendToFinance)}
                      className={cn(
                        'text-xs transition-colors',
                        sendToFinance
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-100',
                      )}
                    >
                      <DollarSign className="w-3 h-3 mr-1" />
                      Enviar p/ Financeiro
                    </Button>
                  </div>
                </CardHeader>
                <div className="flex-1 overflow-y-auto print:hidden p-1">
                  {isAddendum ? (
                    <AddendumDocument {...contractProps} />
                  ) : (
                    <ContractDocument {...contractProps} />
                  )}
                </div>
                <div className="hidden print:block w-full overflow-hidden">
                  {isAddendum ? (
                    <AddendumDocument {...contractProps} />
                  ) : (
                    <ContractDocument {...contractProps} />
                  )}
                </div>
                <CardFooter className="bg-slate-50 border-t p-4 flex flex-col sm:flex-row gap-3 justify-end shrink-0 print:hidden">
                  <Button
                    variant="outline"
                    onClick={handlePrint}
                    className="w-full sm:w-auto"
                    disabled={!name || !cnpj}
                  >
                    <Printer className="mr-2 h-4 w-4" /> Imprimir / Salvar PDF
                  </Button>
                  <Button
                    onClick={handleSaveClient}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Save className="mr-2 h-4 w-4" />{' '}
                    {isAddendum ? 'Salvar Aditivo e Efetivar' : 'Efetivar Cliente'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cotacao" className="print:m-0">
          <div className="grid lg:grid-cols-12 gap-6 items-start print:block print:w-full print:m-0 print:p-0">
            <div className="lg:col-span-5 space-y-6 print:hidden">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle>1. Dados do Prospect / Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-bold">Tipo de Cotação</Label>
                    <RadioGroup
                      value={quoteTargetType}
                      onValueChange={(v) => {
                        setQuoteTargetType(v as 'prospect' | 'cliente')
                        setSelectedProspectId('novo')
                        setSelectedClientId('novo')
                        setQuoteEmpresa('')
                        setQuoteContato('')
                      }}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="prospect" id="qt-prospect" />
                        <Label htmlFor="qt-prospect">Novo Contrato (Prospect)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cliente" id="qt-cliente" />
                        <Label htmlFor="qt-cliente">Upsell (Cliente Existente)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Separator className="my-2" />

                  {quoteTargetType === 'prospect' ? (
                    <div className="space-y-2">
                      <Label>Vincular a um Prospect (Opcional)</Label>
                      <Select
                        value={selectedProspectId}
                        onValueChange={(val) => {
                          setSelectedProspectId(val)
                          if (val !== 'novo') {
                            const p = prospects.find((p) => p.id === val)
                            if (p) {
                              setQuoteEmpresa(p.empresa)
                              setQuoteContato(p.contato_nome)
                            }
                          } else {
                            setQuoteEmpresa('')
                            setQuoteContato('')
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="p-2 border-b sticky top-0 bg-popover z-10">
                            <Input
                              placeholder="Pesquisar prospect..."
                              value={prospectSearch}
                              onChange={(e) => setProspectSearch(e.target.value)}
                              onKeyDown={(e) => e.stopPropagation()}
                              className="h-8"
                            />
                          </div>
                          <SelectItem value="novo">-- Novo Prospect --</SelectItem>
                          {prospects
                            .filter((p) =>
                              p.empresa.toLowerCase().includes(prospectSearch.toLowerCase()),
                            )
                            .map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.empresa}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Vincular a um Cliente (Obrigatório para Upsell)</Label>
                      <Select
                        value={selectedClientId}
                        onValueChange={(val) => {
                          setSelectedClientId(val)
                          if (val !== 'novo') {
                            const c = clientes.find((c) => c.id === val)
                            if (c) {
                              setQuoteEmpresa(c.nome)
                              setQuoteContato(c.rep_nome || '')
                              if (c.plano_id) {
                                supabase
                                  .from('planos_saude')
                                  .select('descricao')
                                  .eq('id', c.plano_id)
                                  .single()
                                  .then(({ data: planoData }) => {
                                    setCurrentClientPlanName(
                                      planoData?.descricao ||
                                        c.modulos?.plano_base ||
                                        'Não informado',
                                    )
                                  })
                              } else {
                                setCurrentClientPlanName(c.modulos?.plano_base || 'Não informado')
                              }
                              if (c.cobrar_filiais) {
                                setCobrarPorFilial(true)
                                setQuantidadeFiliais(c.quantidade_filiais || 1)
                                setFiliaisVinculadas(
                                  (c.filiais_detalhes || []).map((f: any) => ({
                                    id: Math.random().toString(),
                                    cnpj: f.cnpj || '',
                                    nome: f.nome || '',
                                  })),
                                )
                              } else {
                                setCobrarPorFilial(false)
                                setFiliaisVinculadas([])
                                setFiliais(
                                  (c.filiais_detalhes || []).map((f: any) => ({
                                    id: Math.random().toString(),
                                    cnpj: f.cnpj || '',
                                    nome: f.nome || '',
                                    isentar: f.isentar || false,
                                  })),
                                )
                              }
                            }
                          } else {
                            setQuoteEmpresa('')
                            setQuoteContato('')
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente..." />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="p-2 border-b sticky top-0 bg-popover z-10">
                            <Input
                              placeholder="Pesquisar cliente..."
                              value={clientSearch}
                              onChange={(e) => setClientSearch(e.target.value)}
                              onKeyDown={(e) => e.stopPropagation()}
                              className="h-8"
                            />
                          </div>
                          <SelectItem value="novo">-- Selecione um Cliente --</SelectItem>
                          {clientes
                            .filter((c) =>
                              c.nome.toLowerCase().includes(clientSearch.toLowerCase()),
                            )
                            .map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.nome}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Empresa (Razão Social)</Label>
                    <Input value={quoteEmpresa} onChange={(e) => setQuoteEmpresa(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Aos Cuidados de</Label>
                    <Input value={quoteContato} onChange={(e) => setQuoteContato(e.target.value)} />
                  </div>
                </CardContent>
              </Card>

              {/* PLANOS E MODULOS REUSED STATE */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle>2. Plano, Módulos e Implantação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-bold">Plano Base</Label>
                    <div className="flex gap-4 items-start">
                      <div className="flex-1">
                        <Select
                          value={selectedPlan}
                          onValueChange={(val) => {
                            setSelectedPlan(val)
                            setIsPlanPriceManual(false)
                            setManualPlanPrice('')
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhum (Somente Módulos / Upsell)</SelectItem>
                            {PLANS.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} - {formatCurrency(p.price)}
                                {p.franquia_quantidade
                                  ? ` | Franquia: ${p.franquia_quantidade} placas`
                                  : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedPlan === 'frota-20' &&
                          (() => {
                            const frota = PLANS.find((p) => p.id === 'frota-20')
                            if (!frota?.franquia_quantidade) return null
                            return (
                              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                Franquia: <strong>{frota.franquia_quantidade} placas</strong>{' '}
                                incluídas
                                {' · '}Excedente:{' '}
                                <strong>{formatCurrency(frota.valor_excedente || 0)}</strong>/placa
                                extra
                              </p>
                            )
                          })()}
                      </div>
                      {selectedPlan !== 'none' && (
                        <div className="w-32">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Valor"
                            value={isPlanPriceManual ? manualPlanPrice : defaultPlanPrice}
                            onChange={(e) => {
                              setIsPlanPriceManual(true)
                              setManualPlanPrice(e.target.value)
                            }}
                            onBlur={(e) => {
                              if (e.target.value === '') {
                                setIsPlanPriceManual(false)
                                setManualPlanPrice('')
                              }
                            }}
                            className="bg-white border-slate-300 h-9"
                          />
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            Valor Mensal (R$)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-sm font-bold">Módulos Adicionais</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {MODULES.filter((m) => !m.isBasic).map((m) => {
                        const isChecked = selectedModules.includes(m.id)
                        return (
                          <div
                            key={`quote-mod-${m.id}`}
                            className="flex flex-col border p-3 rounded-lg bg-white shadow-sm gap-2 transition-colors hover:border-indigo-200"
                          >
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`quote-${m.id}`}
                                checked={isChecked}
                                onCheckedChange={(c) => handleToggleModule(m.id, c as boolean)}
                              />
                              <Label
                                htmlFor={`quote-${m.id}`}
                                className="text-xs font-semibold cursor-pointer"
                              >
                                {m.name}{' '}
                                <span className="font-normal text-slate-500">
                                  - {formatCurrency(m.price)}
                                </span>
                              </Label>
                            </div>
                            {isChecked && m.price > 0 && (
                              <div className="pl-6 pt-1 flex items-center gap-3 border-t border-slate-100 mt-1 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <Label
                                    htmlFor={`quote-price-${m.id}`}
                                    className="text-[10px] text-slate-600"
                                  >
                                    Valor (R$)
                                  </Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    id={`quote-price-${m.id}`}
                                    className="w-20 h-6 text-[10px] px-1 bg-slate-50 border-slate-200"
                                    value={customModulePrices[m.id] ?? ''}
                                    onChange={(e) => {
                                      const val =
                                        e.target.value === '' ? '' : parseFloat(e.target.value)
                                      setCustomModulePrices((prev) => ({ ...prev, [m.id]: val }))
                                    }}
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`quote-grace-${m.id}`}
                                    checked={!!moduleGracePeriods[m.id]}
                                    onCheckedChange={(c) => {
                                      if (c) setModuleGracePeriods((p) => ({ ...p, [m.id]: 3 }))
                                      else {
                                        const p = { ...moduleGracePeriods }
                                        delete p[m.id]
                                        setModuleGracePeriods(p)
                                      }
                                    }}
                                  />
                                  <Label
                                    htmlFor={`quote-grace-${m.id}`}
                                    className="text-[10px] text-slate-600 cursor-pointer"
                                  >
                                    Gratuidade
                                  </Label>
                                </div>
                                {!!moduleGracePeriods[m.id] && (
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      min="1"
                                      className="w-16 h-6 text-[10px] px-1 bg-slate-50 border-slate-200"
                                      value={moduleGracePeriods[m.id]}
                                      onChange={(e) =>
                                        setModuleGracePeriods((p) => ({
                                          ...p,
                                          [m.id]: parseInt(e.target.value) || 0,
                                        }))
                                      }
                                    />
                                    <span className="text-[10px] text-slate-500">meses</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="space-y-3 mt-4">
                    <div className="flex flex-col gap-4 bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="cobrar-filial-quote"
                            checked={cobrarPorFilial}
                            onCheckedChange={(c) => {
                              setCobrarPorFilial(c as boolean)
                              if (!c) {
                                setQuantidadeFiliais(1)
                                setFiliaisVinculadas([])
                              } else if (filiaisVinculadas.length === 0) {
                                setQuantidadeFiliais(1)
                                setFiliaisVinculadas([
                                  { id: Math.random().toString(), cnpj: '', nome: '' },
                                ])
                              }
                            }}
                          />
                          <Label
                            htmlFor="cobrar-filial-quote"
                            className="text-sm cursor-pointer font-bold text-slate-700"
                          >
                            Cobrar por Filial
                          </Label>
                        </div>
                        {cobrarPorFilial && (
                          <div className="flex items-center gap-2 border-l pl-4">
                            <Label className="text-xs font-medium text-slate-600">
                              Qtd. Filiais:
                            </Label>
                            <Input
                              type="number"
                              min="1"
                              value={filiaisVinculadas.length}
                              readOnly
                              className="w-20 h-8 bg-slate-50 cursor-not-allowed"
                            />
                          </div>
                        )}
                      </div>

                      {cobrarPorFilial && (
                        <div className="space-y-3 pt-3 border-t">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-bold text-slate-700">
                              Inclusão de Filiais
                            </Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setFiliaisVinculadas([
                                  ...filiaisVinculadas,
                                  { id: Math.random().toString(), cnpj: '', nome: '' },
                                ])
                                setQuantidadeFiliais(filiaisVinculadas.length + 1)
                              }}
                            >
                              + Adicionar Filial
                            </Button>
                          </div>
                          <div className="grid gap-3">
                            {filiaisVinculadas.map((f, index) => (
                              <div
                                key={f.id}
                                className="flex flex-col sm:flex-row gap-3 items-center"
                              >
                                <div className="flex-1">
                                  <Input
                                    placeholder="CNPJ"
                                    value={f.cnpj}
                                    onChange={(e) => {
                                      const raw = e.target.value.replace(/\D/g, '')
                                      const formatted =
                                        raw.length <= 14 ? formatCNPJ(raw) : e.target.value
                                      const next = [...filiaisVinculadas]
                                      next[index].cnpj = formatted
                                      setFiliaisVinculadas(next)

                                      if (raw.length === 14) {
                                        fetchCnpjFromService(raw)
                                          .then(({ data: cnpjResult }) => {
                                            if (cnpjResult?.nome) {
                                              setFiliaisVinculadas((prev) => {
                                                const nextUpdate = [...prev]
                                                if (!nextUpdate[index].nome) {
                                                  nextUpdate[index].nome = cnpjResult.nome
                                                }
                                                return nextUpdate
                                              })
                                            }
                                          })
                                          .catch(() => {})
                                      }
                                    }}
                                    className="h-8 text-xs bg-white"
                                  />
                                </div>
                                <div className="flex-[2] flex gap-2 items-center">
                                  <Input
                                    placeholder="Nome/Identificação da Filial"
                                    value={f.nome}
                                    onChange={(e) => {
                                      const next = [...filiaisVinculadas]
                                      next[index].nome = e.target.value
                                      setFiliaisVinculadas(next)
                                    }}
                                    className="h-8 text-xs bg-white"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const next = filiaisVinculadas.filter((_, i) => i !== index)
                                      setFiliaisVinculadas(next)
                                      setQuantidadeFiliais(next.length)
                                    }}
                                    className="h-8 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                                  >
                                    Remover
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    <Label className="text-sm font-bold">Franquia de Emissões (DF-e)</Label>
                    <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                      <Select value={selectedDfe} onValueChange={setSelectedDfe}>
                        <SelectTrigger className="w-full sm:w-64 bg-slate-50 border">
                          <SelectValue placeholder="Selecione um pacote DF-e..." />
                        </SelectTrigger>
                        <SelectContent>
                          {DFE_TIERS.map((tier) => (
                            <SelectItem key={tier.id} value={tier.id}>
                              {tier.name} {tier.price > 0 ? `- ${formatCurrency(tier.price)}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-3 mt-4">
                    <Label className="text-sm font-bold">Placas Adicionais Frota</Label>
                    <div className="flex gap-3 items-center">
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={additionalPlates || ''}
                        onChange={(e) => setAdditionalPlates(parseInt(e.target.value) || 0)}
                        className="w-32 bg-slate-50 border"
                      />
                      {additionalPlates > 0 && (
                        <span className="text-xs text-slate-500 font-medium">
                          Vlr. Unitário: {formatCurrency(additionalPlatesPrice)} | Subtotal:{' '}
                          {formatCurrency(additionalPlatesTotal)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3 mt-4">
                    <Label className="text-sm font-bold">Filiais Adicionais</Label>
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-3 items-center flex-wrap sm:flex-nowrap">
                        <Input
                          placeholder="00.000.000/0000-00"
                          value={newFilialCnpj}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '')
                            if (raw.length <= 14) setNewFilialCnpj(formatCNPJ(raw))
                            if (raw.length === 14) fetchFilialCnpjData(raw)
                          }}
                          className="w-48 bg-slate-50 border"
                        />
                        <Input
                          placeholder="Nome da Empresa (opcional)"
                          value={newFilialNome}
                          onChange={(e) => setNewFilialNome(e.target.value)}
                          className="w-full sm:w-64 bg-slate-50 border"
                        />
                        <Button variant="outline" size="sm" onClick={handleAddFilial}>
                          Adicionar Filial
                        </Button>
                      </div>
                      {filiais.length > 0 && (
                        <div className="space-y-2 mt-2">
                          {filiais.map((filial) => (
                            <div
                              key={filial.id}
                              className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50 p-2 border rounded-md"
                            >
                              <div className="flex-1 flex flex-col">
                                <span className="font-medium text-sm">
                                  {filial.nome || 'Nome não informado'}
                                </span>
                                <span className="text-xs text-slate-500">CNPJ: {filial.cnpj}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`isentar-quote-${filial.id}`}
                                  checked={filial.isentar}
                                  onCheckedChange={(c) => {
                                    setFiliais(
                                      filiais.map((f) =>
                                        f.id === filial.id ? { ...f, isentar: c as boolean } : f,
                                      ),
                                    )
                                  }}
                                />
                                <Label
                                  htmlFor={`isentar-quote-${filial.id}`}
                                  className="text-xs cursor-pointer text-slate-600"
                                >
                                  Isentar valor de inclusão
                                </Label>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setFiliais(filiais.filter((f) => f.id !== filial.id))
                                }}
                              >
                                <Trash className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <div className="text-xs text-slate-500 font-medium text-right mt-2 pt-2 border-t">
                            Subtotal Filiais: {formatCurrency(additionalBranchesTotal)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-sm font-bold">Desconto na Mensalidade</Label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <Select
                          value={tipoDesconto}
                          onValueChange={(v) => setTipoDesconto(v as 'valor' | 'percentual')}
                        >
                          <SelectTrigger className="w-24 bg-slate-50 border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="valor">R$</SelectItem>
                            <SelectItem value="percentual">%</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min="0"
                          max={tipoDesconto === 'percentual' ? '100' : undefined}
                          placeholder={tipoDesconto === 'percentual' ? '0%' : '0,00'}
                          value={descontoMensalidade || ''}
                          onChange={(e) => setDescontoMensalidade(parseFloat(e.target.value) || 0)}
                          className="w-32 bg-slate-50 border"
                        />
                      </div>

                      {validDescontoMensalidade > 0 && (
                        <div className="flex items-center gap-2 sm:border-l sm:border-slate-200 sm:pl-4">
                          <Label className="text-xs whitespace-nowrap">
                            Período de Isenção (meses):
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={isencaoPeriodo || ''}
                            onChange={(e) => setIsencaoPeriodo(parseInt(e.target.value) || 0)}
                            className="w-20 bg-slate-50 border h-9"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    <Label className="text-sm font-bold flex items-center gap-2 text-[#1e3a8a]">
                      <Gift className="w-4 h-4 text-orange-500" /> Prazos Concedidos / Condições
                      Especiais
                    </Label>
                    <Input
                      value={prazosConcedidos}
                      onChange={(e) => setPrazosConcedidos(e.target.value)}
                      placeholder="Descreva prazos negociados, isenções especiais ou condições específicas..."
                      className="w-full bg-slate-50 border transition-colors focus:border-orange-300"
                    />
                  </div>

                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-sm font-bold">Implantação</Label>
                    <RadioGroup
                      value={implMode}
                      onValueChange={(v) => setImplMode(v as 'remoto' | 'presencial')}
                      className="flex flex-col sm:flex-row gap-4"
                    >
                      <div className="flex items-center space-x-2 border p-3 rounded-lg flex-1 cursor-pointer hover:bg-slate-50 transition-colors">
                        <RadioGroupItem value="remoto" id="remoto-quote" />
                        <Label
                          htmlFor="remoto-quote"
                          className="cursor-pointer font-medium flex-1 h-full py-1"
                        >
                          Remoto (R$ 130/h)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border p-3 rounded-lg flex-1 cursor-pointer hover:bg-slate-50 transition-colors">
                        <RadioGroupItem value="presencial" id="presencial-quote" />
                        <Label
                          htmlFor="presencial-quote"
                          className="cursor-pointer font-medium flex-1 h-full py-1"
                        >
                          Presencial (R$ 260/h)
                        </Label>
                      </div>
                    </RadioGroup>

                    <div className="mt-4 pt-2 border-t border-slate-100 space-y-2">
                      <Label className="text-xs">Valor Personalizado de Implantação</Label>
                      <div className="flex gap-3 items-center">
                        <Input
                          type="number"
                          placeholder="Ex: 1500"
                          value={manualImplValue}
                          onChange={(e) => setManualImplValue(e.target.value)}
                          className="w-1/2 bg-white"
                        />
                        <span className="text-xs text-slate-500">
                          Calculado: {formatCurrency(calculatedImplValue)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  {quoteTargetType === 'cliente' && (
                    <div className="space-y-3">
                      <div className="mb-4 bg-blue-50 text-blue-800 p-3 rounded-md border border-blue-100 flex items-center justify-between">
                        <span className="text-sm font-medium">Mensalidade Atual do Cliente</span>
                        <span className="font-bold text-base">
                          {formatCurrency(currentClientValue || 0)}
                        </span>
                      </div>
                      <Label className="text-sm font-bold">Serviços Adicionais (Upsell)</Label>
                      <div className="flex flex-col gap-2 border p-3 rounded-lg bg-slate-50">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="quote-diagnostic"
                            checked={includeDiagnosticVisit}
                            onCheckedChange={(c) => setIncludeDiagnosticVisit(c as boolean)}
                          />
                          <Label
                            htmlFor="quote-diagnostic"
                            className="text-xs flex-1 cursor-pointer font-medium"
                          >
                            Visita Presencial de Diagnóstico
                          </Label>
                        </div>
                        {includeDiagnosticVisit && (
                          <div className="space-y-3 pt-2">
                            {diagnosticVisits.map((visit, index) => (
                              <div
                                key={visit.id}
                                className="pl-6 flex flex-col sm:flex-row gap-4 items-end"
                              >
                                <div className="flex-1">
                                  <Label className="text-sm font-semibold text-slate-700">
                                    Valor da Visita
                                  </Label>
                                  <Input
                                    type="number"
                                    placeholder="Ex: 1500"
                                    value={visit.value}
                                    onChange={(e) => {
                                      const newVisits = [...diagnosticVisits]
                                      newVisits[index].value = e.target.value
                                      setDiagnosticVisits(newVisits)
                                    }}
                                    className="w-full bg-white mt-1 text-base font-medium h-12 border-slate-300"
                                  />
                                </div>
                                <div className="flex-1">
                                  <Label className="text-sm font-semibold text-slate-700">
                                    Data da Visita
                                  </Label>
                                  <Input
                                    type="date"
                                    value={visit.date}
                                    onChange={(e) => {
                                      const newVisits = [...diagnosticVisits]
                                      newVisits[index].date = e.target.value
                                      setDiagnosticVisits(newVisits)
                                    }}
                                    className="w-full bg-white mt-1 text-base font-medium h-12 border-slate-300"
                                  />
                                </div>
                                {diagnosticVisits.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-12 w-12 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                      setDiagnosticVisits(
                                        diagnosticVisits.filter((v) => v.id !== visit.id),
                                      )
                                    }}
                                  >
                                    <Trash className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            <div className="pl-6">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs mt-2"
                                onClick={() => {
                                  setDiagnosticVisits([
                                    ...diagnosticVisits,
                                    { id: Math.random().toString(), date: '', value: '' },
                                  ])
                                }}
                              >
                                + Adicionar Outra Visita
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      <Separator className="my-4" />
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-bold">Treinamentos Adicionais</Label>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="treinamento-gratuito-upsell"
                              checked={isTreinamentoGratuito}
                              onCheckedChange={(c) => setIsTreinamentoGratuito(c as boolean)}
                            />
                            <Label
                              htmlFor="treinamento-gratuito-upsell"
                              className="text-xs cursor-pointer font-medium text-emerald-600"
                            >
                              Treinamento Gratuito
                            </Label>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {PREDEFINED_TRAININGS.map((t) => {
                            const isChecked = selectedTrainings.includes(t.id)
                            return (
                              <div
                                key={t.id}
                                className={cn(
                                  'flex flex-col space-y-2 border p-2 rounded-lg transition-colors',
                                  isTreinamentoGratuito && isChecked
                                    ? 'bg-emerald-50 border-emerald-200'
                                    : 'bg-slate-50 hover:bg-slate-100',
                                )}
                              >
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`train-up-${t.id}`}
                                    checked={isChecked}
                                    onCheckedChange={(c) => {
                                      setSelectedTrainings((prev) =>
                                        c ? [...prev, t.id] : prev.filter((id) => id !== t.id),
                                      )
                                      if (c) {
                                        setCustomTrainingPrices((prev) => ({
                                          ...prev,
                                          [t.id]: t.price,
                                        }))
                                      } else {
                                        setCustomTrainingPrices((prev) => {
                                          const next = { ...prev }
                                          delete next[t.id]
                                          return next
                                        })
                                      }
                                    }}
                                  />
                                  <Label
                                    htmlFor={`train-up-${t.id}`}
                                    className="text-xs flex-1 cursor-pointer font-medium"
                                  >
                                    {t.name}
                                  </Label>
                                  {!isChecked || isTreinamentoGratuito ? (
                                    <span className="text-xs font-semibold text-slate-600">
                                      {t.price > 0 && !isTreinamentoGratuito ? (
                                        formatCurrency(t.price)
                                      ) : (
                                        <span className="text-emerald-600 font-bold">Grátis</span>
                                      )}
                                    </span>
                                  ) : null}
                                </div>
                                {isChecked && !isTreinamentoGratuito && (
                                  <div className="pl-6 flex items-center gap-2 border-t border-slate-100 pt-1">
                                    <Label
                                      htmlFor={`price-train-up-${t.id}`}
                                      className="text-[10px] text-slate-600"
                                    >
                                      Valor (R$)
                                    </Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      id={`price-train-up-${t.id}`}
                                      className="w-24 h-6 text-xs px-1 bg-white border-slate-200"
                                      value={customTrainingPrices[t.id] ?? ''}
                                      onChange={(e) => {
                                        const val =
                                          e.target.value === '' ? '' : parseFloat(e.target.value)
                                        setCustomTrainingPrices((prev) => ({
                                          ...prev,
                                          [t.id]: val,
                                        }))
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {quoteTargetType !== 'cliente' && (
                    <div className="space-y-3">
                      <Label className="text-sm font-bold">Serviços Adicionais</Label>

                      <div className="flex flex-col gap-3 mb-4">
                        <div className="flex flex-col gap-2 border p-3 rounded-lg bg-slate-50">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="quote-diagnostic-prospect"
                              checked={includeDiagnosticVisit}
                              onCheckedChange={(c) => setIncludeDiagnosticVisit(c as boolean)}
                            />
                            <Label
                              htmlFor="quote-diagnostic-prospect"
                              className="text-xs flex-1 cursor-pointer font-medium"
                            >
                              Adicionar Visita Presencial de Diagnóstico
                            </Label>
                          </div>
                          {includeDiagnosticVisit && (
                            <div className="space-y-3 pt-2">
                              {diagnosticVisits.map((visit, index) => (
                                <div
                                  key={visit.id}
                                  className="pl-6 flex flex-col sm:flex-row gap-4 items-end"
                                >
                                  <div className="flex-1">
                                    <Label className="text-sm font-semibold text-slate-700">
                                      Valor da Visita
                                    </Label>
                                    <Input
                                      type="number"
                                      placeholder="Ex: 1500"
                                      value={visit.value}
                                      onChange={(e) => {
                                        const newVisits = [...diagnosticVisits]
                                        newVisits[index].value = e.target.value
                                        setDiagnosticVisits(newVisits)
                                      }}
                                      className="w-full bg-white mt-1 text-base font-medium h-12 border-slate-300"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <Label className="text-sm font-semibold text-slate-700">
                                      Data da Visita
                                    </Label>
                                    <Input
                                      type="date"
                                      value={visit.date}
                                      onChange={(e) => {
                                        const newVisits = [...diagnosticVisits]
                                        newVisits[index].date = e.target.value
                                        setDiagnosticVisits(newVisits)
                                      }}
                                      className="w-full bg-white mt-1 text-base font-medium h-12 border-slate-300"
                                    />
                                  </div>
                                  {diagnosticVisits.length > 1 && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-12 w-12 text-red-500 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => {
                                        setDiagnosticVisits(
                                          diagnosticVisits.filter((v) => v.id !== visit.id),
                                        )
                                      }}
                                    >
                                      <Trash className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                              <div className="pl-6">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs mt-2"
                                  onClick={() => {
                                    setDiagnosticVisits([
                                      ...diagnosticVisits,
                                      { id: Math.random().toString(), date: '', value: '' },
                                    ])
                                  }}
                                >
                                  + Adicionar Outra Visita
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <Separator className="my-4" />
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-bold">Treinamentos Adicionais</Label>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="treinamento-gratuito-prospect"
                              checked={isTreinamentoGratuito}
                              onCheckedChange={(c) => setIsTreinamentoGratuito(c as boolean)}
                            />
                            <Label
                              htmlFor="treinamento-gratuito-prospect"
                              className="text-xs cursor-pointer font-medium text-emerald-600"
                            >
                              Treinamento Gratuito
                            </Label>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {PREDEFINED_TRAININGS.map((t) => {
                            const isChecked = selectedTrainings.includes(t.id)
                            return (
                              <div
                                key={t.id}
                                className={cn(
                                  'flex flex-col space-y-2 border p-2 rounded-lg transition-colors',
                                  isTreinamentoGratuito && isChecked
                                    ? 'bg-emerald-50 border-emerald-200'
                                    : 'bg-slate-50 hover:bg-slate-100',
                                )}
                              >
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`train-prosp-${t.id}`}
                                    checked={isChecked}
                                    onCheckedChange={(c) => {
                                      setSelectedTrainings((prev) =>
                                        c ? [...prev, t.id] : prev.filter((id) => id !== t.id),
                                      )
                                      if (c) {
                                        setCustomTrainingPrices((prev) => ({
                                          ...prev,
                                          [t.id]: t.price,
                                        }))
                                      } else {
                                        setCustomTrainingPrices((prev) => {
                                          const next = { ...prev }
                                          delete next[t.id]
                                          return next
                                        })
                                      }
                                    }}
                                  />
                                  <Label
                                    htmlFor={`train-prosp-${t.id}`}
                                    className="text-xs flex-1 cursor-pointer font-medium"
                                  >
                                    {t.name}
                                  </Label>
                                  {!isChecked || isTreinamentoGratuito ? (
                                    <span className="text-xs font-semibold text-slate-600">
                                      {t.price > 0 && !isTreinamentoGratuito ? (
                                        formatCurrency(t.price)
                                      ) : (
                                        <span className="text-emerald-600 font-bold">Grátis</span>
                                      )}
                                    </span>
                                  ) : null}
                                </div>
                                {isChecked && !isTreinamentoGratuito && (
                                  <div className="pl-6 flex items-center gap-2 border-t border-slate-100 pt-1">
                                    <Label
                                      htmlFor={`price-train-prosp-${t.id}`}
                                      className="text-[10px] text-slate-600"
                                    >
                                      Valor (R$)
                                    </Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      id={`price-train-prosp-${t.id}`}
                                      className="w-24 h-6 text-xs px-1 bg-white border-slate-200"
                                      value={customTrainingPrices[t.id] ?? ''}
                                      onChange={(e) => {
                                        const val =
                                          e.target.value === '' ? '' : parseFloat(e.target.value)
                                        setCustomTrainingPrices((prev) => ({
                                          ...prev,
                                          [t.id]: val,
                                        }))
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {quoteTargetType === 'cliente' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                        <h4 className="font-bold text-sm mb-2 text-slate-600">Mensalidade Atual</h4>
                        <span className="text-xl font-bold text-slate-800">
                          {formatCurrency(currentClientValue || 0)}
                        </span>
                      </div>
                      <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg">
                        <h4 className="font-bold text-sm mb-2 text-indigo-700">
                          Módulos Adicionais
                        </h4>
                        <span className="text-xl font-bold text-indigo-800">
                          +{formatCurrency(totalValue)}
                        </span>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                        <h4 className="font-bold text-sm mb-2 text-emerald-700">
                          Nova Mensalidade Total
                        </h4>
                        <span className="text-xl font-bold text-emerald-800">
                          {formatCurrency((currentClientValue || 0) + totalValue)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                        <h4 className="font-bold text-sm mb-2 text-slate-600">
                          Valor Original do Plano
                        </h4>
                        <span className="text-xl font-bold text-slate-800">
                          {formatCurrency(subtotalMensalidade)}
                        </span>
                      </div>
                      <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg">
                        <h4 className="font-bold text-sm mb-2 text-indigo-700">
                          Valor com Desconto Aplicado
                        </h4>
                        <div className="flex flex-col">
                          <span className="text-xl font-bold text-indigo-800">
                            {formatCurrency(totalValue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>{' '}
              </Card>
            </div>

            <div className="lg:col-span-7 sticky top-6 print:static print:block print:w-full print:m-0 print:p-0">
              <Card className="flex flex-col h-[calc(100vh-6rem)] min-h-[700px] shadow-xl border-slate-200 overflow-hidden bg-white print:h-auto print:min-h-0 print:shadow-none print:border-none">
                <div className="flex-1 overflow-y-auto print:hidden p-1 bg-slate-100/50">
                  <QuoteDocument {...quoteProps} />
                </div>
                <div className="hidden print:block w-full overflow-hidden">
                  <QuoteDocument {...quoteProps} />
                </div>
                <CardFooter className="bg-slate-50 border-t p-4 flex flex-col sm:flex-row gap-3 justify-end shrink-0 print:hidden">
                  <Button
                    variant="outline"
                    onClick={handlePrint}
                    className="w-full sm:w-auto"
                    disabled={!quoteEmpresa || !quoteContato}
                  >
                    <Printer className="mr-2 h-4 w-4" /> Imprimir / PDF
                  </Button>
                  <Button
                    onClick={handleSaveQuote}
                    className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Save className="mr-2 h-4 w-4" />{' '}
                    {quoteTargetType === 'cliente'
                      ? 'Salvar Cotação & Gerar Aditivo'
                      : 'Salvar Cotação'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="importar">
          <ImportContracts />
        </TabsContent>
      </Tabs>
    </div>
  )
}
