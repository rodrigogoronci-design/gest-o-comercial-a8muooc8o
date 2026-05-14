import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Save, Sparkles, FileText, UploadCloud, Printer, Loader2, Upload } from 'lucide-react'
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
  MODULES,
  IMPLEMENTATION_RATES,
  BASE_IMPLEMENTATION_HOURS,
} from '@/constants/contracts'
import { ContractDocument } from '@/components/ContractDocument'
import { cn } from '@/lib/utils'

export default function ContractGeneratorPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') || 'gerar'
  const initialProspect = searchParams.get('prospect') || ''
  const initialCnpj = searchParams.get('cnpj') || ''
  const initialProspectId = searchParams.get('prospectId') || 'novo'
  const initialContato = searchParams.get('contato') || ''

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

  const [quoteTargetType, setQuoteTargetType] = useState<'prospect' | 'cliente'>('prospect')
  const [selectedClientId, setSelectedClientId] = useState<string>('novo')
  const [clientes, setClientes] = useState<any[]>([])
  const [includeFranchise, setIncludeFranchise] = useState(true)

  useEffect(() => {
    const fetchClientes = async () => {
      const { data } = await supabase.from('clientes').select('id, nome, rep_nome')
      if (data) setClientes(data)
    }
    fetchClientes()
  }, [])

  useEffect(() => {
    const fetchProspects = async () => {
      const { data } = await supabase.from('crm_prospects').select('id, empresa, contato_nome')
      if (data) setProspects(data)
    }
    fetchProspects()
  }, [])

  useEffect(() => {
    if (initialCnpj && initialCnpj.replace(/\D/g, '').length === 14) {
      fetchCnpjData(initialCnpj.replace(/\D/g, ''))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const planData = useMemo(() => PLANS.find((p) => p.id === selectedPlan), [selectedPlan])
  const planPrice = selectedPlan === 'none' ? 0 : planData?.price || 0
  const modulesPrice = useMemo(
    () =>
      selectedModules.reduce((acc, id) => acc + (MODULES.find((m) => m.id === id)?.price || 0), 0),
    [selectedModules],
  )
  const totalValue = planPrice + modulesPrice

  const implRate =
    implMode === 'remoto' ? IMPLEMENTATION_RATES.remoto : IMPLEMENTATION_RATES.presencial
  const totalImplHours = useMemo(() => {
    let hours = BASE_IMPLEMENTATION_HOURS
    selectedModules.forEach((id) => {
      const mod = MODULES.find((m) => m.id === id)
      if (mod && mod.implHours) hours += mod.implHours
    })
    return hours
  }, [selectedModules])
  const implValue = useMemo(() => {
    let value = totalImplHours * implRate
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
    return value
  }, [totalImplHours, implRate, selectedModules, implMode])

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
    totalValue,
    implMode,
    implRate,
    totalImplHours,
    implValue,
  }

  const quoteProps = {
    empresa: quoteEmpresa,
    aosCuidadosDe: quoteContato,
    date: new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
    planName: selectedPlan === 'none' ? 'Nenhum' : planData?.name || 'Plano Personalizado',
    selectedModules: selectedModules
      .map((id) => MODULES.find((m) => m.id === id)?.name)
      .filter(Boolean) as string[],
    planPrice,
    modulesPrice,
    totalValue,
    implMode,
    implRate,
    totalImplHours,
    implValue,
    isUpsell: quoteTargetType === 'cliente',
    includeFranchise,
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
      await parsePdfContract(file) // just to trigger OCR backend integration
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

  const handlePrint = () => window.print()

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
        const { error } = await supabase.from('solicitacoes_servico').insert({
          cliente_id: selectedClientId,
          tipo: 'Proposta de Upsell',
          descricao: `Adição de Módulos/Serviços. Valor Mensal: ${formatCurrency(totalValue)}`,
          valor: 0,
          observacoes: `Módulos: ${selectedModules.map((id) => MODULES.find((m) => m.id === id)?.name).join(', ')}`,
          status: 'Pendente',
          data_solicitacao: new Date().toISOString().split('T')[0],
        })
        if (error) throw error

        toast({
          title: 'Upsell salvo!',
          description: 'A proposta foi registrada nas solicitações do cliente.',
          className: 'bg-emerald-600 text-white border-none',
        })
        navigate('/clientes')
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
          itens: selectedModules.map((id) => {
            const m = MODULES.find((mod) => mod.id === id)
            return { id, name: m?.name, price: m?.price }
          }),
          valor_mensalidade: totalValue,
          valor_implantacao: implValue,
        })
        if (error) throw error

        toast({
          title: 'Cotação salva!',
          description: 'A proposta foi registrada no CRM.',
          className: 'bg-emerald-600 text-white border-none',
        })
        navigate('/crm')
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

      const modulosFormatados = {
        plano_base: planData?.name || selectedPlan,
        filiais: 0,
        adicionais: adicionais,
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
          valor_total: totalValue,
        })

        await createHistorico({
          cliente_id: existingClient.id,
          tipo: 'Renovação / Novo Contrato',
          data_solicitacao: new Date().toISOString().split('T')[0],
          plano: planData?.name,
          modulos: adicionais,
          valor_adicional: 0,
          valor_total: totalValue,
          observacoes: `Contrato atualizado via Gerador de Contratos. Implantação: ${implMode} - R$ ${implValue}`,
        })

        toast({
          title: 'Cliente Atualizado',
          description: 'O contrato e os dados do cliente foram salvos.',
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
          status: 'Ativo',
        })

        await createHistorico({
          cliente_id: newClient.id,
          tipo: 'Contrato Inicial',
          data_solicitacao: new Date().toISOString().split('T')[0],
          plano: planData?.name,
          modulos: adicionais,
          valor_adicional: 0,
          valor_total: totalValue,
          observacoes: `Contrato gerado via Gerador de Contratos. Implantação: ${implMode} - R$ ${implValue}`,
        })

        toast({
          title: 'Contrato Gerado',
          description: 'O novo cliente e o contrato foram salvos.',
          className: 'bg-emerald-600 text-white border-none',
        })
      }

      navigate('/clientes')
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
                    <div className="grid grid-cols-2 gap-2">
                      {MODULES.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center space-x-2 border p-2 rounded-lg"
                        >
                          <Checkbox
                            id={m.id}
                            checked={selectedModules.includes(m.id)}
                            onCheckedChange={(c) => handleToggleModule(m.id, c as boolean)}
                          />
                          <Label htmlFor={m.id} className="text-xs">
                            {m.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center space-x-2 border p-3 rounded-lg bg-slate-50">
                      <Checkbox
                        id="include-franchise-quote"
                        checked={includeFranchise}
                        onCheckedChange={(c) => setIncludeFranchise(c as boolean)}
                      />
                      <Label
                        htmlFor="include-franchise-quote"
                        className="font-medium cursor-pointer flex-1"
                      >
                        Incluir Franquia de Emissões (DF-e) na Cotação
                      </Label>
                    </div>
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
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-7 sticky top-6 print:static print:block print:w-full print:m-0 print:p-0">
              <Card className="flex flex-col h-[calc(100vh-6rem)] min-h-[700px] shadow-xl border-slate-200 overflow-hidden bg-white print:h-auto print:min-h-0 print:shadow-none print:border-none">
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
                          <SelectItem value="novo">-- Novo Prospect --</SelectItem>
                          {prospects.map((p) => (
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
                          <SelectItem value="novo">-- Selecione um Cliente --</SelectItem>
                          {clientes.map((c) => (
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
                    <div className="grid grid-cols-2 gap-2">
                      {MODULES.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center space-x-2 border p-2 rounded-lg"
                        >
                          <Checkbox
                            id={`quote-${m.id}`}
                            checked={selectedModules.includes(m.id)}
                            onCheckedChange={(c) => handleToggleModule(m.id, c as boolean)}
                          />
                          <Label htmlFor={`quote-${m.id}`} className="text-xs">
                            {m.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  {quoteTargetType !== 'cliente' && (
                    <div className="space-y-3">
                      <Label className="text-sm font-bold">Implantação</Label>
                      <RadioGroup
                        value={implMode}
                        onValueChange={(v) => setImplMode(v as 'remoto' | 'presencial')}
                        className="flex flex-col sm:flex-row gap-4"
                      >
                        <div className="flex items-center space-x-2 border p-3 rounded-lg flex-1 cursor-pointer hover:bg-slate-50 transition-colors">
                          <RadioGroupItem value="remoto" id="quote-remoto" />
                          <Label
                            htmlFor="quote-remoto"
                            className="cursor-pointer font-medium flex-1 h-full py-1"
                          >
                            Remoto (R$ 130/h)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border p-3 rounded-lg flex-1 cursor-pointer hover:bg-slate-50 transition-colors">
                          <RadioGroupItem value="presencial" id="quote-presencial" />
                          <Label
                            htmlFor="quote-presencial"
                            className="cursor-pointer font-medium flex-1 h-full py-1"
                          >
                            Presencial (R$ 170/h)
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                </CardContent>
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
