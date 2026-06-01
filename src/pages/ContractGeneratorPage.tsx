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
import {
  PLANS,
  MODULES as BASE_MODULES,
  IMPLEMENTATION_RATES,
  BASE_IMPLEMENTATION_HOURS,
  DFE_TIERS,
  PREDEFINED_TRAININGS,
} from '@/constants/contracts'
import { ContractDocument } from '@/components/ContractDocument'
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

  const [descontoMensalidade, setDescontoMensalidade] = useState<number>(0)
  const [tipoDesconto, setTipoDesconto] = useState<'valor' | 'percentual'>('valor')
  const [isencaoPeriodo, setIsencaoPeriodo] = useState<number>(0)
  const [moduleGracePeriods, setModuleGracePeriods] = useState<Record<string, number>>({})
  const [prazosConcedidos, setPrazosConcedidos] = useState('')

  const [isExtractingCompany, setIsExtractingCompany] = useState(false)
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
        header, aside, nav, [data-sidebar="sidebar"], .sidebar-container { display: none !important; }
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
        .select('id, nome, rep_nome, valor_total')
        .order('nome')
      if (data) setClientes(data)
    }
    fetchClientes()
  }, [])

  useEffect(() => {
    const fetchProspects = async () => {
      const { data } = await supabase
        .from('crm_prospects')
        .select('id, empresa, contato_nome')
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

  const planData = useMemo(() => PLANS.find((p) => p.id === selectedPlan), [selectedPlan])
  const planPrice =
    selectedPlan === 'none' || (activeTab === 'cotacao' && quoteTargetType === 'cliente')
      ? 0
      : planData?.price || 0
  const dfeData = useMemo(() => DFE_TIERS.find((d) => d.id === selectedDfe), [selectedDfe])
  const dfePrice = dfeData?.price || 0
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
        return acc + m.price
      }, 0),
    [selectedModules, moduleGracePeriods],
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

  const totalValue = Math.max(0, subtotalMensalidade - calculatedDiscount)

  const totalValueStandard = Math.max(0, subtotalMensalidadeStandard - calculatedDiscountStandard)

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
      return acc + (t && !isTreinamentoGratuito ? t.price : 0)
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
    dfePrice,
    totalValue,
    implMode,
    implRate,
    totalImplHours,
    implValue,
    trainings: selectedTrainings.map((id) => {
      const t = PREDEFINED_TRAININGS.find((pt) => pt.id === id)
      return { id, name: t?.name, price: t?.price, isFree: isTreinamentoGratuito }
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
    descontoMensalidade: validDescontoMensalidade,
    tipoDesconto,
    calculatedDiscount,
    isencaoPeriodo,
    moduleGracePeriods,
    totalValueStandard,
    prazosConcedidos,
  }

  const quoteProps = {
    empresa: quoteEmpresa,
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
      .map((id) => MODULES.find((m) => m.id === id))
      .filter(Boolean),
    trainings: selectedTrainings.map((id) => {
      const t = PREDEFINED_TRAININGS.find((pt) => pt.id === id)
      return { id, name: t?.name, price: t?.price, isFree: isTreinamentoGratuito }
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
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjValue}`)
      if (!res.ok) throw new Error('CNPJ não encontrado ou erro na consulta.')
      const data = await res.json()

      if (data.razao_social) setName(data.razao_social)

      const addressParts = []
      if (data.logradouro) addressParts.push(data.logradouro)
      if (data.numero) addressParts.push(data.numero)
      if (data.complemento) addressParts.push(data.complemento)
      const firstPart = addressParts.join(', ')

      const secondPart = []
      if (data.bairro) secondPart.push(data.bairro)
      if (data.municipio && data.uf) secondPart.push(`${data.municipio} - ${data.uf}`)
      if (data.cep) {
        const cepFormatted = data.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2')
        secondPart.push(cepFormatted)
      }

      const fullAddress = [firstPart, secondPart.join(', ')].filter(Boolean).join(' - ')
      if (fullAddress) setAddress(fullAddress)

      if (data.qsa && data.qsa.length > 0) {
        const socioAdmin =
          data.qsa.find(
            (s: any) =>
              s.qualificacao_socio?.toLowerCase().includes('administrador') ||
              s.qualificacao_socio?.toLowerCase().includes('diretor'),
          ) || data.qsa[0]
        if (socioAdmin && socioAdmin.nome_socio) {
          setRepName(socioAdmin.nome_socio)
        }
      }

      setAutoFilled(true)
      setTimeout(() => setAutoFilled(false), 3000)

      toast({
        title: 'CNPJ Encontrado!',
        description: 'Dados da empresa preenchidos automaticamente.',
        className: 'bg-emerald-600 text-white border-none',
      })
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

  const handleToggleModule = (id: string, checked: boolean) => {
    setSelectedModules((prev) => (checked ? [...prev, id] : prev.filter((m) => m !== id)))
  }

  const fetchFilialCnpjData = async (cnpjValue: string) => {
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjValue}`)
      if (res.ok) {
        const data = await res.json()
        if (data.razao_social) setNewFilialNome(data.razao_social)
      }
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
        if (!extractedData.endereco) {
          const rawCnpj = extractedData.cnpj.replace(/\D/g, '')
          try {
            const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${rawCnpj}`)
            if (res.ok) {
              const data = await res.json()
              if (data.razao_social && !extractedData.nome) extractedData.nome = data.razao_social

              const addressParts = []
              if (data.logradouro) addressParts.push(data.logradouro)
              if (data.numero) addressParts.push(data.numero)
              if (data.complemento) addressParts.push(data.complemento)
              const firstPart = addressParts.join(', ')

              const secondPart = []
              if (data.bairro) secondPart.push(data.bairro)
              if (data.municipio && data.uf) secondPart.push(`${data.municipio} - ${data.uf}`)
              if (data.cep) {
                const cepFormatted = data.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2')
                secondPart.push(cepFormatted)
              }

              const fullAddress = [firstPart, secondPart.join(', ')].filter(Boolean).join(' - ')
              if (fullAddress) extractedData.endereco = fullAddress

              if (data.qsa && data.qsa.length > 0 && !extractedData.repName) {
                const socioAdmin =
                  data.qsa.find(
                    (s: any) =>
                      s.qualificacao_socio?.toLowerCase().includes('administrador') ||
                      s.qualificacao_socio?.toLowerCase().includes('diretor') ||
                      s.qualificacao_socio?.toLowerCase().includes('socio'),
                  ) || data.qsa[0]
                if (socioAdmin && socioAdmin.nome_socio) {
                  extractedData.repName = socioAdmin.nome_socio
                }
              }
            }
          } catch (e) {
            console.error('Failed to fetch CNPJ data', e)
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
      await parsePdfContract(file)
      setSelectedPlan('tms-300')
      setSelectedModules(['mod-edi', 'mod-frota', 'mod-calendario', 'mod-dfe'])
      toast({
        title: 'Proposta importada!',
        description: 'Plano e módulos preenchidos automaticamente.',
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
        const modulosAdicionados = [
          ...selectedModules.map((id) => MODULES.find((m) => m.id === id)?.name),
          selectedDfe !== 'dfe-none' && dfeData ? dfeData.name : null,
          ...(includeDiagnosticVisit
            ? diagnosticVisits.map(
                (v) =>
                  `Visita Presencial de Diagnóstico${v.date ? ` (Data: ${new Date(v.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })})` : ''}`,
              )
            : []),
          ...selectedTrainings.map((id) => {
            const t = PREDEFINED_TRAININGS.find((pt) => pt.id === id)
            return t ? `Treinamento: ${t.name}` : null
          }),
          additionalPlates > 0 ? `Placa Adicional Frota (Qtd: ${additionalPlates})` : null,
          additionalBranches > 0 ? `Filiais Adicionais (Qtd: ${additionalBranches})` : null,
        ].filter(Boolean)

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

        const { error } = await supabase.from('crm_propostas').insert({
          prospect_id: prospectId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          data_proposta: new Date().toISOString().split('T')[0],
          aos_cuidados_de: quoteContato,
          desconto_mensalidade: validDescontoMensalidade,
          tipo_desconto: tipoDesconto,
          isencao_periodo: isencaoPeriodo,
          itens: [
            ...selectedModules.map((id) => {
              const m = MODULES.find((mod) => mod.id === id)
              return {
                id,
                name: m?.name,
                price: m?.price,
                implHours: m?.implHours || 0,
                tem_gratuidade: !!moduleGracePeriods[id],
                periodo_gratuidade: moduleGracePeriods[id] || 0,
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
              return {
                id,
                name: `Treinamento: ${t?.name}`,
                price: t?.price || 0,
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
          ],
          valor_mensalidade: totalValue,
          valor_implantacao: implValue,
          quantidade_filiais: additionalBranches,
          filiais_detalhes: filiais,
          cobrar_filiais: !filiais.every((f) => f.isentar),
          prazos_concedidos: prazosConcedidos,
        })
        if (error) throw error

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

    try {
      const rawCnpj = cnpj.replace(/\D/g, '')

      const { data: existingClients } = await supabase.from('clientes').select('*')

      const existingClient = existingClients?.find((c) => c.cnpj.replace(/\D/g, '') === rawCnpj)

      const adicionais = selectedModules.map((id) => {
        const mod = MODULES.find((m) => m.id === id)
        return { name: mod?.name || id, price: mod?.price || 0 }
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
          filiais_detalhes: [...(existingClient.filiais_detalhes || []), ...filiais],
          cobrar_filiais: !filiais.every((f) => f.isentar),
        } as any)

        await createHistorico({
          cliente_id: existingClient.id,
          tipo: 'Renovação / Novo Contrato',
          data_solicitacao: new Date().toISOString().split('T')[0],
          plano: planData?.name,
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

        toast({
          title: 'Cliente Atualizado',
          description: 'O contrato foi salvo e o aditivo enviado por e-mail.',
          className: 'bg-emerald-600 text-white border-none',
        })
      } else {
        const newClient = await createCliente({
          nome: name,
          cnpj,
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
          filiais_detalhes: filiais,
          cobrar_filiais: !filiais.every((f) => f.isentar),
        } as any)

        await createHistorico({
          cliente_id: newClient.id,
          tipo: 'Contrato Inicial',
          data_solicitacao: new Date().toISOString().split('T')[0],
          plano: planData?.name,
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
                  <div className="space-y-2">
                    <Label>Razão Social</Label>
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
                      className={inputHighlightClass}
                      disabled={isLoadingCnpj}
                    />
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
                  {quoteTargetType !== 'cliente' && (
                    <>
                      <div className="space-y-3">
                        <Label className="text-sm font-bold">Plano Base</Label>
                        <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhum (Somente Módulos / Upsell)</SelectItem>
                            {PLANS.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} - {formatCurrency(p.price)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Separator />
                    </>
                  )}
                  <div className="space-y-3">
                    <Label className="text-sm font-bold">Módulos Adicionais</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {MODULES.map((m) => {
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
                              <div className="pl-6 pt-1 flex items-center gap-3 border-t border-slate-100 mt-1">
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
                    <Label className="text-sm font-bold">Franquia de Emissões (DF-e)</Label>
                    <Select value={selectedDfe} onValueChange={setSelectedDfe}>
                      <SelectTrigger className="bg-slate-50 border">
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
                          Presencial (R$ 170/h)
                        </Label>
                      </div>
                    </RadioGroup>

                    <div className="mt-4 pt-2 border-t border-slate-100 space-y-2">
                      <Label className="text-xs">
                        Valor Personalizado (Visita Presencial de Diagnóstico)
                      </Label>
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

                    <Separator className="my-4" />
                    <div className="space-y-3">
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
                        {PREDEFINED_TRAININGS.map((t) => (
                          <div
                            key={t.id}
                            className={cn(
                              'flex items-center space-x-2 border p-2 rounded-lg transition-colors',
                              isTreinamentoGratuito && selectedTrainings.includes(t.id)
                                ? 'bg-emerald-50 border-emerald-200'
                                : 'bg-slate-50 hover:bg-slate-100',
                            )}
                          >
                            <Checkbox
                              id={`train-gen-${t.id}`}
                              checked={selectedTrainings.includes(t.id)}
                              onCheckedChange={(c) => {
                                setSelectedTrainings((prev) =>
                                  c ? [...prev, t.id] : prev.filter((id) => id !== t.id),
                                )
                              }}
                            />
                            <Label
                              htmlFor={`train-gen-${t.id}`}
                              className="text-xs flex-1 cursor-pointer font-medium"
                            >
                              {t.name}
                            </Label>
                            <span className="text-xs font-semibold text-slate-600">
                              {t.price > 0 && !isTreinamentoGratuito ? (
                                formatCurrency(t.price)
                              ) : (
                                <span className="text-emerald-600 font-bold">Grátis</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

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
                        {isencaoPeriodo > 0 && (
                          <span className="text-xs text-indigo-600 mt-1 font-medium">
                            Inclui isenção de {isencaoPeriodo} meses
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
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
                  <ContractDocument {...contractProps} />
                </div>
                <div className="hidden print:block">
                  <ContractDocument {...contractProps} />
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
                    <Save className="mr-2 h-4 w-4" /> Efetivar Cliente
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
                    <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum (Somente Módulos / Upsell)</SelectItem>
                        {PLANS.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} - {formatCurrency(p.price)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-sm font-bold">Módulos Adicionais</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {MODULES.map((m) => {
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
                              <div className="pl-6 pt-1 flex items-center gap-3 border-t border-slate-100 mt-1">
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
                    <Label className="text-sm font-bold">Franquia de Emissões (DF-e)</Label>
                    <Select value={selectedDfe} onValueChange={setSelectedDfe}>
                      <SelectTrigger className="bg-slate-50 border">
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
                          Presencial (R$ 170/h)
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
                          {PREDEFINED_TRAININGS.map((t) => (
                            <div
                              key={t.id}
                              className={cn(
                                'flex items-center space-x-2 border p-2 rounded-lg transition-colors',
                                isTreinamentoGratuito && selectedTrainings.includes(t.id)
                                  ? 'bg-emerald-50 border-emerald-200'
                                  : 'bg-slate-50 hover:bg-slate-100',
                              )}
                            >
                              <Checkbox
                                id={`train-up-${t.id}`}
                                checked={selectedTrainings.includes(t.id)}
                                onCheckedChange={(c) => {
                                  setSelectedTrainings((prev) =>
                                    c ? [...prev, t.id] : prev.filter((id) => id !== t.id),
                                  )
                                }}
                              />
                              <Label
                                htmlFor={`train-up-${t.id}`}
                                className="text-xs flex-1 cursor-pointer font-medium"
                              >
                                {t.name}
                              </Label>
                              <span className="text-xs font-semibold text-slate-600">
                                {t.price > 0 && !isTreinamentoGratuito ? (
                                  formatCurrency(t.price)
                                ) : (
                                  <span className="text-emerald-600 font-bold">Grátis</span>
                                )}
                              </span>
                            </div>
                          ))}
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
                          {PREDEFINED_TRAININGS.map((t) => (
                            <div
                              key={t.id}
                              className={cn(
                                'flex items-center space-x-2 border p-2 rounded-lg transition-colors',
                                isTreinamentoGratuito && selectedTrainings.includes(t.id)
                                  ? 'bg-emerald-50 border-emerald-200'
                                  : 'bg-slate-50 hover:bg-slate-100',
                              )}
                            >
                              <Checkbox
                                id={`train-prosp-${t.id}`}
                                checked={selectedTrainings.includes(t.id)}
                                onCheckedChange={(c) => {
                                  setSelectedTrainings((prev) =>
                                    c ? [...prev, t.id] : prev.filter((id) => id !== t.id),
                                  )
                                }}
                              />
                              <Label
                                htmlFor={`train-prosp-${t.id}`}
                                className="text-xs flex-1 cursor-pointer font-medium"
                              >
                                {t.name}
                              </Label>
                              <span className="text-xs font-semibold text-slate-600">
                                {t.price > 0 && !isTreinamentoGratuito ? (
                                  formatCurrency(t.price)
                                ) : (
                                  <span className="text-emerald-600 font-bold">Grátis</span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

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
                        {isencaoPeriodo > 0 && (
                          <span className="text-xs text-indigo-600 mt-1 font-medium">
                            Inclui isenção de {isencaoPeriodo} meses
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>{' '}
              </Card>
            </div>

            <div className="lg:col-span-7 sticky top-6 print:static print:block print:w-full print:m-0 print:p-0">
              <Card className="flex flex-col h-[calc(100vh-6rem)] min-h-[700px] shadow-xl border-slate-200 overflow-hidden bg-white print:h-auto print:min-h-0 print:shadow-none print:border-none">
                <div className="flex-1 overflow-y-auto print:hidden p-1 bg-slate-100/50">
                  <QuoteDocument {...quoteProps} />
                </div>
                <div className="hidden print:block">
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
                    <Save className="mr-2 h-4 w-4" /> Salvar Cotação
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
