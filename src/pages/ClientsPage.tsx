import { useState, useEffect, useRef } from 'react'
import {
  Search,
  Filter,
  Eye,
  Plus,
  Building2,
  Mail,
  Phone,
  Hash,
  Edit,
  Trash2,
  FileText,
  Upload,
  Loader2,
  Calendar,
  CheckCircle,
  Printer,
  ChevronDown,
  Ban,
  Send,
  PenLine,
  Rocket,
  DollarSign,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatCNPJ, formatDate } from '@/lib/formatters'
import { fetchClientes, createCliente, updateCliente, deleteCliente } from '@/services/clientes'
import { getHistoricoByCliente, createHistorico } from '@/services/historico_contratos'
import {
  getSolicitacoesByCliente,
  createSolicitacao,
  deleteSolicitacao,
  updateSolicitacao,
} from '@/services/solicitacoes_servico'
import { z } from 'zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { supabase } from '@/lib/supabase/client'
import { calculateFinancialScore } from '@/lib/financial-score'
import { fetchCnpjData } from '@/services/cnpj'
import {
  PLANS,
  MODULES,
  BASE_IMPLEMENTATION_HOURS,
  IMPLEMENTATION_RATES,
} from '@/constants/contracts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ContractDocument } from '@/components/ContractDocument'
import { AddendumDocument } from '@/components/AddendumDocument'
import { TrainingProposalDocument } from '@/components/TrainingProposalDocument'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { AdvancedDatePicker } from '@/components/ui/advanced-date-picker'
import { useAuth } from '@/hooks/use-auth'
import { ClientAtendimentosTab } from '@/components/ClientAtendimentosTab'
import { ClientContractUpload } from '@/components/ClientContractUpload'
import { getSignedContractUrl } from '@/lib/storage'

export interface ClienteRecord {
  id: string
  nome: string
  cnpj: string
  email?: string | null
  telefone?: string | null
  endereco?: string | null
  rep_nome?: string | null
  rep_cpf?: string | null
  rep_rg?: string | null
  valor_implantacao?: number | null
  modo_implantacao?: string | null
  modulos?: any
  valor_total?: number | null
  status?: string | null
  created_at: string
  contrato_url?: string | null
  cobrancas?: { data_vencimento: string; valor: number }[] | null
  documentos_urls?: { name: string; url: string; category?: string; uploaded_at?: string }[] | null
  diagnostico?: any
  tags?: string[]
  desconto_mensalidade?: number | null
  tipo_desconto?: string | null
  filiais_detalhes?: any
  quantidade_filiais?: number | null
  cobrar_filiais?: boolean | null
  data_assinatura?: string | null
  vencimento_mensal?: number | null
  data_cancelamento?: string | null
  motivo_cancelamento?: string | null
  link_assinatura?: string | null
}

type ModuleItem = { name: string; price: number }

const TRAINING_FEATURES: Record<string, string[]> = {
  Financeiro: [
    'Controle de contas a pagar e receber',
    'Conciliação bancária',
    'Emissão de boletos com baixa automática',
    'Fluxo de caixa',
    'Plano de contas',
    'DRE gerencial',
    'Controle de cheques e recibos',
    'Relatórios financeiros completos',
  ],
  Faturamento: [
    'Cadastro de tabelas de faturamento',
    'Faturamento em lote',
    'Faturamento automático',
    'Integração com o financeiro',
    'Relatórios gerenciais',
  ],
  'Carga (Transporte)': [
    'Emissão do CT-e Normal, Contingência e Complementar',
    'Emissão de MDF-e e NFS-e',
    'Importação do XML da NF-e externa',
    'Averbação de Seguro',
    'Emissão do Contrato de Frete/CIOT',
    'Controle de Entregas Realizadas',
  ],
  'Frota - Compras': [
    'Solicitação de compras',
    'Cotação de preços',
    'Pedido de compras',
    'Entrada de notas fiscais',
  ],
  'Frota - Estoque': [
    'Cadastro de peças e produtos',
    'Movimentação e controle de estoque',
    'Inventário',
    'Controle de EPIs',
  ],
  'Frota - Abastecimento': [
    'Abastecimento interno e externo',
    'Controle de bombas (bomba interna)',
    'Integração com cartões de abastecimento',
    'Médias de consumo',
  ],
  'Frota - Manutenção': [
    'Manutenção preventiva e corretiva',
    'Plano de manutenção',
    'Ordem de serviço',
    'Apontamento de mecânicos',
  ],
  'Frota - Pneu': [
    'Cadastro e controle de vida do pneu',
    'Movimentação de pneus (montagem/desmontagem)',
    'Controle de sulcos e desgaste',
    'Envio para recapagem',
  ],
  'Frota - Vencimento': [
    'Controle de vencimentos de CNH e MOPP',
    'Controle de exames médicos',
    'Licenciamento de veículos e multas',
    'Avisos e alertas automáticos',
  ],
  Comercial: [
    'Criação, registro e controle de propostas comerciais',
    'Envio automático em formato PDF',
    'Controle de aprovação',
  ],
  Fiscal: [
    'Geração de arquivos SPED (EFD contribuições / EFD fiscal)',
    'Geração do Sintegra',
    'Relatórios de livros fiscais',
    'Emissão de NF-e e Apuração de ICMS-CIAP',
  ],
}

type FilialDetalhe = {
  id: string
  nome: string
  cnpj: string
  dfe_incluso: boolean
  valor_mensalidade: number
  valor_dfe?: number
}

type MergedClient = {
  id: string
  name: string
  cnpj: string
  endereco?: string | null
  rep_nome?: string | null
  rep_cpf?: string | null
  rep_rg?: string | null
  valor_implantacao?: number | null
  modo_implantacao?: string | null
  modules: ModuleItem[]
  plano_base?: string
  filiais?: number
  filiais_detalhes?: FilialDetalhe[]
  totalValue: number
  createdAt: string
  isMock?: boolean
  originalData?: ClienteRecord
  contratoUrl?: string | null
  stats?: ReturnType<typeof calculateFinancialScore>
  cobrancas?: { data_vencimento: string; valor: number }[]
  tags?: string[]
  desconto_mensalidade?: number
  tipo_desconto?: 'valor' | 'percentual'
  data_assinatura?: string | null
  vencimento_mensal?: number | null
  data_cancelamento?: string | null
  motivo_cancelamento?: string | null
  link_assinatura?: string | null
}

const clientSchema = z.object({
  nome: z.string().min(2, 'Razão Social é obrigatória'),
  cnpj: z.string().min(14, 'CNPJ inválido'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().optional().or(z.literal('')),
  endereco: z.string().optional().or(z.literal('')),
  rep_nome: z.string().optional().or(z.literal('')),
  rep_cpf: z.string().optional().or(z.literal('')),
  rep_rg: z.string().optional().or(z.literal('')),
  valor_implantacao: z.number().optional(),
  modo_implantacao: z.string().optional(),
  modulos: z
    .array(
      z.object({
        name: z.string(),
        price: z.number(),
      }),
    )
    .or(z.array(z.string())),
  plano_base: z.string().optional().or(z.literal('')),
  filiais: z.number().min(0).default(0),
  valor_total: z.number().min(0, 'Valor inválido'),
  desconto_mensalidade: z.number().min(0).optional().default(0),
  tipo_desconto: z.enum(['valor', 'percentual']).optional().default('valor'),
  cobrar_filiais: z.boolean().optional().default(false),
  quantidade_filiais: z.number().min(0).default(0),
  filiais_detalhes: z
    .array(
      z.object({
        nome: z.string().optional(),
        cnpj: z.string().min(14, 'CNPJ inválido'),
      }),
    )
    .optional()
    .default([]),
  data_assinatura: z.string().optional().or(z.literal('')),
  vencimento_mensal: z.number().min(1, 'Dia inválido').max(31, 'Dia inválido').optional(),
})

type ClientFormValues = z.infer<typeof clientSchema>

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filterType, setFilterType] = useState<'all' | 'with_contract' | 'without_contract'>('all')
  const [clientes, setClientes] = useState<ClienteRecord[]>([])
  const [receipts, setReceipts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<MergedClient | null>(null)

  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false)
  const [viewingClient, setViewingClient] = useState<MergedClient | null>(null)

  const [clientHistory, setClientHistory] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false)
  const [selectedNewModules, setSelectedNewModules] = useState<string[]>([])
  const [aditivoDate, setAditivoDate] = useState(new Date().toISOString().split('T')[0])
  const [isSubmittingAditivo, setIsSubmittingAditivo] = useState(false)

  const [viewingAddendum, setViewingAddendum] = useState<any>(null)

  const [clientToDelete, setClientToDelete] = useState<MergedClient | null>(null)

  const [isAddFilialOpen, setIsAddFilialOpen] = useState(false)
  const [filialForm, setFilialForm] = useState({
    nome: '',
    cnpj: '',
    dfe_incluso: false,
    valor_mensalidade: 199.0,
    valor_dfe: 49.9,
  })

  const [solicitacoes, setSolicitacoes] = useState<any[]>([])
  const [isLoadingSolicitacoes, setIsLoadingSolicitacoes] = useState(false)
  const [isAddSolicitacaoOpen, setIsAddSolicitacaoOpen] = useState(false)

  // Form states for Solicitacao
  const [solicitacaoTipo, setSolicitacaoTipo] = useState('Treinamento')
  const [solicitacaoDescricao, setSolicitacaoDescricao] = useState('')
  const [solicitacaoData, setSolicitacaoData] = useState('')
  const [solicitacaoValor, setSolicitacaoValor] = useState<number | ''>('')
  const [solicitacaoFormaPagamento, setSolicitacaoFormaPagamento] = useState('Boleto')
  const [solicitacaoDataVencimento, setSolicitacaoDataVencimento] = useState('')
  const [solicitacaoObservacoes, setSolicitacaoObservacoes] = useState('')
  const [isSubmittingSolicitacao, setIsSubmittingSolicitacao] = useState(false)
  const [editingSolicitacaoId, setEditingSolicitacaoId] = useState<string | null>(null)
  const [solicitacaoContatoNome, setSolicitacaoContatoNome] = useState('')
  const [solicitacaoContatoTelefone, setSolicitacaoContatoTelefone] = useState('')
  const [solicitacaoDocumentoFile, setSolicitacaoDocumentoFile] = useState<File | null>(null)
  const [solicitacaoDocumentoUrl, setSolicitacaoDocumentoUrl] = useState<string>('')

  const [isDocUploadOpen, setIsDocUploadOpen] = useState(false)
  const [docUploadCategory, setDocUploadCategory] = useState('Cartão CNPJ')
  const [docUploadFile, setDocUploadFile] = useState<File | null>(null)

  const { user } = useAuth()

  const [isSetupTrainingProposalOpen, setIsSetupTrainingProposalOpen] = useState(false)
  const [selectedTrainingModules, setSelectedTrainingModules] = useState<string[]>([])
  const [trainingPrice, setTrainingPrice] = useState<number>(0)
  const [viewingTrainingProposal, setViewingTrainingProposal] = useState<any>(null)

  const [flagNotifyImplantacao, setFlagNotifyImplantacao] = useState(false)
  const [flagNotifyFinanceiro, setFlagNotifyFinanceiro] = useState(false)

  const handleOpenContract = async (contratoUrl: string | null) => {
    if (!contratoUrl) {
      toast.error('Nenhum contrato anexado a este cliente.')
      return
    }
    const toastId = toast.loading('Abrindo contrato...')
    const { url, error } = await getSignedContractUrl(contratoUrl)
    if (url) {
      window.open(url, '_blank')
      toast.success('Contrato aberto em nova aba.', { id: toastId })
    } else {
      toast.error(error || 'Documento não encontrado no armazenamento.', { id: toastId })
    }
  }

  // Upsell Modal
  const [isUpsellModalOpen, setIsUpsellModalOpen] = useState(false)
  const [upsellModules, setUpsellModules] = useState<string[]>([])
  const [upsellOneTimeValue, setUpsellOneTimeValue] = useState<number | ''>('')
  const [upsellRecurringValue, setUpsellRecurringValue] = useState<number | ''>('')
  const [upsellDate, setUpsellDate] = useState(new Date().toISOString().split('T')[0])
  const [isSubmittingUpsell, setIsSubmittingUpsell] = useState(false)

  useEffect(() => {
    if (isUpsellModalOpen) {
      const total = upsellModules
        .map((id) => MODULES.find((m) => m.id === id)?.price || 0)
        .reduce((a, b) => a + b, 0)
      setUpsellRecurringValue(total)
    }
  }, [upsellModules, isUpsellModalOpen])

  const handleSaveUpsell = async () => {
    if (!viewingClient) return
    if (upsellModules.length === 0) {
      toast.error('Selecione ao menos um módulo.')
      return
    }

    setIsSubmittingUpsell(true)
    try {
      const mods = upsellModules.map((id) => MODULES.find((m) => m.id === id)!).filter(Boolean)

      const solicitacao = await createSolicitacao({
        cliente_id: viewingClient.id,
        tipo: 'Upsell',
        descricao: `Proposta de Upsell: ${mods.map((m) => m.name).join(', ')}`,
        valor: upsellRecurringValue === '' ? 0 : Number(upsellRecurringValue),
        observacoes: `Valor de Implantação/Único: R$ ${upsellOneTimeValue === '' ? 0 : Number(upsellOneTimeValue).toFixed(2)}`,
        status: 'Pendente',
        data_solicitacao: upsellDate || null,
      })

      // The trigger creates the historico, we just update it with modulos and type
      await supabase
        .from('historico_contratos')
        .update({
          tipo: 'Upsell',
          modulos: mods,
        })
        .eq('solicitacao_id', solicitacao.id)

      toast.success('Proposta de Upsell gerada com sucesso!')
      setIsUpsellModalOpen(false)
      setUpsellModules([])
      setUpsellOneTimeValue('')
      setUpsellRecurringValue('')

      loadSolicitacoes(viewingClient.id)
      loadHistory(viewingClient.id)
    } catch (error: any) {
      console.error(error)
      toast.error('Erro ao gerar upsell.')
    } finally {
      setIsSubmittingUpsell(false)
    }
  }

  const updateSolicitacaoStatus = async (sol: any, newStatus: string) => {
    if (!viewingClient) return
    if (sol.status === newStatus) return

    try {
      await updateSolicitacao(sol.id, { status: newStatus })

      if (newStatus === 'Validada' || newStatus === 'Cancelado') {
        await createHistorico({
          cliente_id: viewingClient.id,
          tipo: `Proposta ${newStatus}`,
          data_solicitacao: new Date().toISOString().split('T')[0],
          observacoes: `A solicitação "${sol.tipo}" teve o status alterado para ${newStatus}.`,
          valor_total: viewingClient.totalValue,
        })
      }

      toast.success(`Status alterado para ${newStatus}`)
      loadSolicitacoes(viewingClient.id)
      loadHistory(viewingClient.id)
    } catch (err) {
      toast.error('Erro ao atualizar status')
    }
  }

  const handleEfetivar = async (sol: any) => {
    if (!viewingClient) return
    if (!confirm('Deseja realmente efetivar esta solicitação?')) return

    try {
      let novoValorTotal = viewingClient.totalValue

      if (sol.tipo === 'Upsell') {
        const { data: hist } = await supabase
          .from('historico_contratos')
          .select('modulos, valor_adicional')
          .eq('solicitacao_id', sol.id)
          .maybeSingle()

        const novosModulos = hist?.modulos || []

        let currentModulosRaw = viewingClient.originalData?.modulos || {
          plano_base: viewingClient.plano_base,
          filiais: viewingClient.filiais,
          adicionais: viewingClient.modules,
        }

        if (Array.isArray(currentModulosRaw)) {
          currentModulosRaw = {
            plano_base: viewingClient.plano_base,
            filiais: viewingClient.filiais,
            adicionais: currentModulosRaw,
          }
        }

        const updatedAdicionais = [
          ...(currentModulosRaw.adicionais || []),
          ...novosModulos.map((m: any) => ({ name: m.name, price: m.price })),
        ]
        novoValorTotal = viewingClient.totalValue + (hist?.valor_adicional || sol.valor || 0)

        await updateCliente(viewingClient.id, {
          modulos: { ...currentModulosRaw, adicionais: updatedAdicionais },
          valor_total: novoValorTotal,
        })
      }

      await updateSolicitacao(sol.id, { status: 'Efetivado' })

      await createHistorico({
        cliente_id: viewingClient.id,
        tipo: sol.tipo === 'Upsell' ? 'Upsell Efetivado' : 'Serviço Efetivado',
        data_solicitacao: new Date().toISOString().split('T')[0],
        observacoes: `A solicitação "${sol.tipo}" foi efetivada e o serviço iniciado/concluído.`,
        valor_total: novoValorTotal,
      })

      toast.success('Solicitação efetivada com sucesso!')
      loadClientes()
      loadSolicitacoes(viewingClient.id)
      loadHistory(viewingClient.id)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao efetivar')
    }
  }

  const resetSolicitacaoForm = () => {
    setEditingSolicitacaoId(null)
    setSolicitacaoTipo('Treinamento')
    setSolicitacaoDescricao('')
    setSolicitacaoData('')
    setSolicitacaoValor('')
    setSolicitacaoFormaPagamento('Boleto')
    setSolicitacaoDataVencimento('')
    setSolicitacaoObservacoes('')
    setSolicitacaoContatoNome('')
    setSolicitacaoContatoTelefone('')
    setSolicitacaoDocumentoFile(null)
    setSolicitacaoDocumentoUrl('')
  }

  const [implementationEmailClient, setImplementationEmailClient] = useState<MergedClient | null>(
    null,
  )
  const [emailBody, setEmailBody] = useState('')

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [cancelClient, setCancelClient] = useState<MergedClient | null>(null)
  const [isSendingContract, setIsSendingContract] = useState(false)
  const [isSendingImplementation, setIsSendingImplementation] = useState(false)
  const [isSendingFinanceiro, setIsSendingFinanceiro] = useState(false)
  const [isSignatureLinkOpen, setIsSignatureLinkOpen] = useState(false)
  const [signatureLinkValue, setSignatureLinkValue] = useState('')
  const [signatureLinkClient, setSignatureLinkClient] = useState<MergedClient | null>(null)
  const [autoSendContractAfterLink, setAutoSendContractAfterLink] = useState(false)
  const [cancelDate, setCancelDate] = useState('')
  const [cancelMotivo, setCancelMotivo] = useState('')
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false)

  const handleRemoveModule = async (moduleToRemove: ModuleItem) => {
    if (!viewingClient) return
    if (!confirm('Tem certeza que deseja remover "' + moduleToRemove.name + '"?')) return

    try {
      let currentModulosRaw = viewingClient.originalData?.modulos || {
        plano_base: viewingClient.plano_base,
        filiais: viewingClient.filiais,
        adicionais: viewingClient.modules,
      }

      if (Array.isArray(currentModulosRaw)) {
        currentModulosRaw = {
          plano_base: viewingClient.plano_base,
          filiais: viewingClient.filiais,
          adicionais: currentModulosRaw,
        }
      }

      let updatedAdicionais = [...(currentModulosRaw.adicionais || [])]
      let updatedFiliaisDet = [...(currentModulosRaw.filiais_detalhes || [])]

      let priceToDeduct = moduleToRemove.price
      let extractedCnpj = ''
      const isFilial = (moduleToRemove.name || '').startsWith('Filial: ')

      if (isFilial) {
        const cnpjMatch = (moduleToRemove.name || '').match(/\(([\d.\-/]+)\)/)
        if (cnpjMatch && cnpjMatch[1]) {
          extractedCnpj = cnpjMatch[1].replace(/\D/g, '')

          const filialToRemove = updatedFiliaisDet.find(
            (f: any) => f.cnpj.replace(/\D/g, '') === extractedCnpj,
          )

          if (filialToRemove) {
            if (filialToRemove.dfe_incluso) {
              const dfeName = 'DF-e (Filial: ' + (filialToRemove.nome || '') + ')'
              const dfeMod = updatedAdicionais.find(
                (m: any) => (typeof m === 'string' ? m : m.name) === dfeName,
              )
              if (dfeMod) {
                priceToDeduct +=
                  (typeof dfeMod === 'string' ? 0 : dfeMod.price) || filialToRemove.valor_dfe || 0
              }
              updatedAdicionais = updatedAdicionais.filter(
                (m: any) => (typeof m === 'string' ? m : m.name) !== dfeName,
              )
            }
          }

          updatedFiliaisDet = updatedFiliaisDet.filter(
            (f: any) => f.cnpj.replace(/\D/g, '') !== extractedCnpj,
          )
        }
      }

      updatedAdicionais = updatedAdicionais.filter((m: any) => {
        const name = typeof m === 'string' ? m : m.name
        return name !== moduleToRemove.name
      })

      const updatedModulos = {
        ...currentModulosRaw,
        adicionais: updatedAdicionais,
        filiais_detalhes: updatedFiliaisDet,
      }

      let novoValorTotal = viewingClient.totalValue - priceToDeduct
      if (novoValorTotal < 0) novoValorTotal = 0

      await updateCliente(viewingClient.id, {
        modulos: updatedModulos,
        valor_total: novoValorTotal,
        filiais_detalhes:
          viewingClient.originalData?.filiais_detalhes?.filter(
            (f: any) => (f.cnpj || '').replace(/\D/g, '') !== extractedCnpj,
          ) || [],
        quantidade_filiais: Math.max(
          0,
          (viewingClient.originalData?.quantidade_filiais || 0) - (extractedCnpj ? 1 : 0),
        ),
      })

      await createHistorico({
        cliente_id: viewingClient.id,
        tipo: 'Remoção de Item',
        data_solicitacao: new Date().toISOString().split('T')[0],
        observacoes: 'Remoção manual do item: ' + moduleToRemove.name,
        valor_adicional: -priceToDeduct,
        valor_total: novoValorTotal,
      })

      toast.success('Item removido com sucesso!')

      loadClientes()
      loadHistory(viewingClient.id)

      const parsedModules = (viewingClient.modules || []).filter((m) => {
        if ((m.name || '') === moduleToRemove.name) return false
        if (isFilial && (m.name || '').includes(extractedCnpj) && (m.name || '').startsWith('DF-e'))
          return false
        return true
      })

      setViewingClient({
        ...viewingClient,
        modules: parsedModules,
        filiais_detalhes: updatedFiliaisDet,
        totalValue: novoValorTotal,
        originalData: {
          ...viewingClient.originalData!,
          modulos: updatedModulos,
          valor_total: novoValorTotal,
        },
      })
    } catch (err) {
      console.error(err)
      toast.error('Erro ao remover o item')
    }
  }

  const [isImporting, setIsImporting] = useState(false)
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false)
  const [isUploadingDocs, setIsUploadingDocs] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDeleteHistory = async (id: string) => {
    if (
      !confirm(
        'Tem certeza que deseja apagar este registro do histórico e reverter a adição no plano atual (se aplicável)?',
      )
    )
      return
    try {
      const historyRecord = clientHistory.find((h) => h.id === id)

      if (viewingClient && historyRecord) {
        let changed = false
        let novoValorTotal = viewingClient.totalValue

        let currentModulosRaw = viewingClient.originalData?.modulos || {
          plano_base: viewingClient.plano_base,
          filiais: viewingClient.filiais,
          adicionais: viewingClient.modules,
        }

        if (Array.isArray(currentModulosRaw)) {
          currentModulosRaw = {
            plano_base: viewingClient.plano_base,
            filiais: viewingClient.filiais,
            adicionais: currentModulosRaw,
          }
        }

        let updatedAdicionais = [...(currentModulosRaw.adicionais || [])]
        let updatedFiliaisDet = [...(currentModulosRaw.filiais_detalhes || [])]

        if (historyRecord.tipo === 'Aditivo de Módulos' && historyRecord.modulos) {
          const removedNames = (
            Array.isArray(historyRecord.modulos) ? historyRecord.modulos : []
          ).map((m: any) => (typeof m === 'string' ? m : m.name))
          updatedAdicionais = updatedAdicionais.filter((m: any) => {
            const name = typeof m === 'string' ? m : m.name
            return !removedNames.includes(name)
          })
          novoValorTotal -= historyRecord.valor_adicional || 0
          changed = true
        } else if (historyRecord.tipo === 'Aditivo de Filial' && historyRecord.observacoes) {
          const cnpjMatch = historyRecord.observacoes.match(/CNPJ:\s*([\d.\-/]+)/)
          if (cnpjMatch && cnpjMatch[1]) {
            const extractedCnpj = cnpjMatch[1].replace(/\D/g, '')

            const filialToRemove = updatedFiliaisDet.find(
              (f: any) => (f.cnpj || '').replace(/\D/g, '') === extractedCnpj,
            )
            if (filialToRemove) {
              const filialName = `Filial: ${filialToRemove.nome || ''} (${formatCNPJ(filialToRemove.cnpj || '')})`
              const dfeName = `DF-e (Filial: ${filialToRemove.nome || ''})`

              updatedAdicionais = updatedAdicionais.filter((m: any) => {
                const name = typeof m === 'string' ? m : m.name
                return name !== filialName && name !== dfeName
              })
            } else {
              updatedAdicionais = updatedAdicionais.filter((m: any) => {
                const name = typeof m === 'string' ? m : m.name
                return !(
                  (name || '').includes('Filial:') &&
                  (name || '').replace(/\D/g, '').includes(extractedCnpj)
                )
              })
            }

            updatedFiliaisDet = updatedFiliaisDet.filter(
              (f: any) => (f.cnpj || '').replace(/\D/g, '') !== extractedCnpj,
            )
            novoValorTotal -= historyRecord.valor_adicional || 0
            changed = true
          }
        }

        if (changed) {
          novoValorTotal = Math.max(0, novoValorTotal)
          const updatedModulos = {
            ...currentModulosRaw,
            adicionais: updatedAdicionais,
            filiais_detalhes: updatedFiliaisDet,
          }

          await updateCliente(viewingClient.id, {
            modulos: updatedModulos,
            valor_total: novoValorTotal,
          })

          const formatMod = (m: any): ModuleItem | null => {
            if (!m) return null
            const mName = typeof m === 'string' ? m : String(m?.name || '')
            if (!mName) return null
            const mPrice = typeof m === 'string' ? undefined : m.price
            const modDef = MODULES.find(
              (x) => x.name.toLowerCase() === mName.toLowerCase() || x.id === mName,
            )
            if (!modDef) {
              if (mPrice !== undefined) return { name: mName, price: mPrice }
              return null
            }
            return { name: modDef.name, price: mPrice !== undefined ? mPrice : modDef.price }
          }

          let parsedModules = updatedAdicionais.map(formatMod).filter(Boolean) as ModuleItem[]

          updatedFiliaisDet.forEach((f: any) => {
            const filialName = `Filial: ${f.nome} (${formatCNPJ(f.cnpj)})`
            const dfeName = `DF-e (Filial: ${f.nome})`

            if (!parsedModules.some((m) => m.name === filialName)) {
              parsedModules.push({ name: filialName, price: f.valor_mensalidade })
            }
            if (f.dfe_incluso && !parsedModules.some((m) => m.name === dfeName)) {
              parsedModules.push({ name: dfeName, price: f.valor_dfe || 0 })
            }
          })

          setViewingClient((prev) =>
            prev
              ? {
                  ...prev,
                  modules: parsedModules,
                  filiais_detalhes: updatedFiliaisDet,
                  totalValue: novoValorTotal,
                  originalData: {
                    ...prev.originalData!,
                    modulos: updatedModulos,
                    valor_total: novoValorTotal,
                  },
                }
              : null,
          )

          loadClientes()
        }
      }

      await supabase.from('historico_contratos').delete().eq('id', id)
      if (viewingClient) loadHistory(viewingClient.id)

      toast.success('Registro apagado com sucesso!')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao apagar registro')
    }
  }

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nome: '',
      cnpj: '',
      email: '',
      telefone: '',
      modulos: [],
      plano_base: '',
      filiais: 0,
      valor_total: 0,
      desconto_mensalidade: 0,
      tipo_desconto: 'valor',
      cobrar_filiais: false,
      quantidade_filiais: 0,
      data_assinatura: '',
      vencimento_mensal: undefined,
      filiais_detalhes: [],
    },
  })

  const {
    fields: filiaisFields,
    append: appendFilial,
    remove: removeFilial,
  } = useFieldArray({
    control: form.control,
    name: 'filiais_detalhes',
  })

  const watchPlanoBase = form.watch('plano_base')
  const watchFiliais = form.watch('filiais')
  const watchModulos = form.watch('modulos')
  const watchDesconto = form.watch('desconto_mensalidade')
  const watchTipoDesconto = form.watch('tipo_desconto')

  useEffect(() => {
    if (!isSheetOpen) return
    const isDirty =
      form.formState.dirtyFields.plano_base ||
      form.formState.dirtyFields.filiais ||
      form.formState.dirtyFields.modulos ||
      form.formState.dirtyFields.desconto_mensalidade ||
      form.formState.dirtyFields.tipo_desconto

    if (isDirty || editingClient) {
      let total = 0
      if (watchPlanoBase) {
        const plan = PLANS.find((p) => p.id === watchPlanoBase || p.name === watchPlanoBase)
        if (plan) total += plan.price
      }

      if (watchFiliais) {
        total += watchFiliais * 199.0
      }

      if (watchModulos) {
        watchModulos.forEach((modItem: any) => {
          if (typeof modItem === 'string') {
            const mod = MODULES.find((m) => m.name === modItem || m.id === modItem)
            if (mod) total += mod.price
          } else if (modItem && typeof modItem.price === 'number') {
            total += modItem.price
          }
        })
      }

      let calcDiscount =
        watchTipoDesconto === 'percentual'
          ? (total * (watchDesconto || 0)) / 100
          : watchDesconto || 0

      form.setValue('valor_total', Math.max(0, total - calcDiscount), { shouldValidate: true })
    }
  }, [
    watchPlanoBase,
    watchFiliais,
    watchModulos,
    watchDesconto,
    watchTipoDesconto,
    isSheetOpen,
    form,
    editingClient,
  ])

  useEffect(() => {
    loadClientes()
  }, [])

  const loadClientes = async () => {
    setIsLoading(true)
    try {
      const [data, { data: receiptsData }] = await Promise.all([
        fetchClientes(),
        supabase
          .from('recebimentos')
          .select(
            'cliente_id, cnpj, status, dias_vencidos, data_pagamento, data_vencimento, razao_social, valor_titulo',
          )
          .limit(10000),
      ])
      setClientes(data)
      setReceipts(receiptsData || [])
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar clientes do banco')
    } finally {
      setIsLoading(false)
    }
  }

  const loadHistory = async (clienteId: string) => {
    setIsLoadingHistory(true)
    try {
      const history = await getHistoricoByCliente(clienteId)
      setClientHistory(history)
    } catch (error) {
      console.error('Failed to load history', error)
      toast.error('Erro ao carregar histórico do cliente')
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const loadSolicitacoes = async (clienteId: string) => {
    setIsLoadingSolicitacoes(true)
    try {
      const data = await getSolicitacoesByCliente(clienteId)
      setSolicitacoes(data)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar solicitações')
    } finally {
      setIsLoadingSolicitacoes(false)
    }
  }

  useEffect(() => {
    if (viewingClient && isViewSheetOpen) {
      loadSolicitacoes(viewingClient.id)
    }
  }, [viewingClient, isViewSheetOpen])

  const handleCnpjChange = async (val: string) => {
    const formatted = formatCNPJ(val)
    form.setValue('cnpj', formatted, { shouldValidate: true })
    const clean = formatted.replace(/\D/g, '')

    if (clean.length === 14) {
      setIsLoadingCnpj(true)
      try {
        const existing = clientes.find((c) => c.cnpj.replace(/\D/g, '') === clean)
        if (existing) {
          toast.info('Cliente já cadastrado na base. Preenchendo dados...')
          if (!form.getValues('nome')) form.setValue('nome', existing.nome)
          if (!form.getValues('email')) form.setValue('email', existing.email || '')
          if (!form.getValues('telefone')) form.setValue('telefone', existing.telefone || '')
          if (!form.getValues('endereco')) form.setValue('endereco', existing.endereco || '')
          if (!form.getValues('rep_nome')) form.setValue('rep_nome', existing.rep_nome || '')
          if (!form.getValues('rep_cpf')) form.setValue('rep_cpf', existing.rep_cpf || '')
          if (!form.getValues('rep_rg')) form.setValue('rep_rg', existing.rep_rg || '')
          setIsLoadingCnpj(false)
          return
        }

        const { data: prospect } = await supabase
          .from('crm_prospects')
          .select('*')
          .eq('cnpj', formatted)
          .maybeSingle()
        if (prospect) {
          toast.info('Prospect encontrado no CRM. Preenchendo dados...')
          if (!form.getValues('nome')) form.setValue('nome', prospect.empresa)
          if (!form.getValues('endereco')) form.setValue('endereco', prospect.endereco || '')
          if (!form.getValues('telefone')) form.setValue('telefone', prospect.telefone || '')
          if (!form.getValues('email')) form.setValue('email', prospect.email || '')
          if (!form.getValues('rep_nome')) form.setValue('rep_nome', prospect.contato_nome || '')
          setIsLoadingCnpj(false)
          return
        }

        const { data: cnpjData, error: cnpjError, notFound } = await fetchCnpjData(clean)
        if (cnpjData) {
          if (cnpjData.nome && !form.getValues('nome')) form.setValue('nome', cnpjData.nome)
          if (cnpjData.endereco && !form.getValues('endereco'))
            form.setValue('endereco', cnpjData.endereco)
          if (cnpjData.telefone && !form.getValues('telefone'))
            form.setValue('telefone', cnpjData.telefone)
          if (cnpjData.email && !form.getValues('email')) form.setValue('email', cnpjData.email)
          toast.success('Dados preenchidos via Receita Federal.')
        } else if (notFound) {
          toast.warning(
            'CNPJ não encontrado. Por favor, verifique os dados ou preencha manualmente.',
          )
        } else if (cnpjError) {
          toast.warning(
            'Serviço de consulta indisponível. Você pode preencher os dados manualmente.',
          )
        }
      } catch {
        toast.error('Erro ao consultar CNPJ. Preencha os dados manualmente.')
      } finally {
        setIsLoadingCnpj(false)
      }
    }
  }

  const handleOpenAdd = () => {
    setEditingClient(null)
    form.reset({
      nome: '',
      cnpj: '',
      email: '',
      telefone: '',
      endereco: '',
      rep_nome: '',
      rep_cpf: '',
      rep_rg: '',
      valor_implantacao: 0,
      modo_implantacao: 'remoto',
      modulos: MODULES.filter((m: any) => m.isBasic).map((m: any) => ({
        name: m.name,
        price: m.price,
      })),
      plano_base: '',
      filiais: 0,
      valor_total: 0,
      desconto_mensalidade: 0,
      tipo_desconto: 'valor',
      cobrar_filiais: false,
      quantidade_filiais: 0,
      data_assinatura: '',
      vencimento_mensal: undefined,
      filiais_detalhes: [],
    })
    setIsSheetOpen(true)
  }

  const handleOpenEdit = (client: MergedClient) => {
    setEditingClient(client)
    form.reset({
      nome: client.name,
      cnpj: client.cnpj,
      email: client.originalData?.email || '',
      telefone: client.originalData?.telefone || '',
      endereco: client.endereco || '',
      rep_nome: client.rep_nome || '',
      rep_cpf: client.rep_cpf || '',
      rep_rg: client.rep_rg || '',
      valor_implantacao: client.valor_implantacao || 0,
      modo_implantacao: client.modo_implantacao || 'remoto',
      modulos: client.modules || [],
      plano_base: client.plano_base || '',
      filiais: client.filiais || 0,
      valor_total: client.totalValue || 0,
      desconto_mensalidade: client.desconto_mensalidade || 0,
      tipo_desconto: client.tipo_desconto || 'valor',
      cobrar_filiais: client.originalData?.cobrar_filiais || false,
      quantidade_filiais:
        client.originalData?.quantidade_filiais ||
        client.originalData?.filiais_detalhes?.length ||
        0,
      data_assinatura: client.data_assinatura || '',
      vencimento_mensal: client.vencimento_mensal ?? undefined,
      filiais_detalhes: client.originalData?.filiais_detalhes || [],
    })
    setIsSheetOpen(true)
  }

  const handleOpenView = (client: MergedClient) => {
    setViewingClient(client)
    setIsViewSheetOpen(true)
  }

  const handleConfirmDocUpload = async () => {
    if (!viewingClient || !docUploadFile) return
    setIsUploadingDocs(true)
    try {
      const file = docUploadFile
      const fileName = `${viewingClient.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const { error: uploadError } = await supabase.storage
        .from('client-files')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage.from('client-files').getPublicUrl(fileName)

      const newDoc = {
        name: file.name,
        url: publicUrlData.publicUrl,
        category: docUploadCategory,
        uploaded_at: new Date().toISOString(),
      }

      const currentClient = clientes.find((c) => c.id === viewingClient.id)
      const currentDocs = currentClient?.documentos_urls || []
      const updatedDocs = [...currentDocs, newDoc]

      await updateCliente(viewingClient.id, { documentos_urls: updatedDocs })
      toast.success('Documento anexado com sucesso!')
      loadClientes()

      setViewingClient({
        ...viewingClient,
        originalData: {
          ...viewingClient.originalData!,
          documentos_urls: updatedDocs,
        },
      })
      setIsDocUploadOpen(false)
      setDocUploadFile(null)
      setDocUploadCategory('Cartão CNPJ')
    } catch (error: any) {
      console.error('Upload Error:', error)
      toast.error('Erro ao fazer upload: ' + (error.message || 'Falha desconhecida'))
    } finally {
      setIsUploadingDocs(false)
    }
  }

  const handleDeleteDoc = async (clientId: string, docUrl: string) => {
    try {
      const currentClient = clientes.find((c) => c.id === clientId)
      if (!currentClient) return

      const currentDocs = currentClient.documentos_urls || []
      const updatedDocs = currentDocs.filter((d) => d.url !== docUrl)

      await updateCliente(clientId, { documentos_urls: updatedDocs })
      toast.success('Documento removido!')
      loadClientes()

      if (viewingClient && viewingClient.id === clientId) {
        setViewingClient({
          ...viewingClient,
          originalData: {
            ...viewingClient.originalData!,
            documentos_urls: updatedDocs,
          },
        })
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao remover documento')
    }
  }

  const handleOpenContractUrl = async (url: string | null) => {
    if (!url) {
      toast.error('Nenhum contrato anexado.')
      return
    }
    try {
      const { url: signedUrl, error } = await getSignedContractUrl(url)
      if (error || !signedUrl) {
        toast.error(error || 'Documento não encontrado')
      } else {
        window.open(signedUrl, '_blank')
      }
    } catch {
      toast.error('Erro ao abrir contrato')
    }
  }

  const handleOpenFinanceiroEmail = async (client: MergedClient) => {
    const subject = encodeURIComponent(`Faturamento - ${client.name}`)
    const body = encodeURIComponent(`Boa tarde, pessoal.

Peço, por gentileza, realizar a emissão da cobrança referente à implantação do sistema e também da primeira mensalidade conforme alinhado comercialmente.

Cliente: ${client.name}
CNPJ: ${formatCNPJ(client.cnpj)}

Favor considerar:

* Cobrança da implantação com vencimento em: ***/***/____
* Primeira mensalidade com vencimento : ***/***/____

O prazo foi definido considerando o cronograma padrão de implantação, contemplando:

* Kick-off e parametrização;
* Treinamentos;
* Operação assistida;
* Encerramento e transição para o suporte.

Qualquer dúvida fico à disposição.

Obrigada,`)

    window.open(`mailto:financeiro@servicelogic.com.br?subject=${subject}&body=${body}`, '_blank')

    try {
      await updateCliente(client.id, { status: 'Faturamento' })
      toast.success("Status atualizado para 'Faturamento'")
      loadClientes()
      if (viewingClient && viewingClient.id === client.id) {
        setViewingClient({
          ...viewingClient,
          originalData: { ...viewingClient.originalData!, status: 'Faturamento' },
        })
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao atualizar status do cliente')
    }
  }

  const handleOpenImplementationEmail = (client: MergedClient) => {
    setImplementationEmailClient(client)
    const plan = PLANS.find((p) => p.name === client.plano_base || p.id === client.plano_base)
    const modulosInclusos = [
      'Administração',
      'Básico',
      'Carga',
      'Comercial',
      'Faturamento',
      'Financeiro',
    ]
    const modulosAdicionais = client.modules.map((m) => m.name).join('\n') || 'Nenhum'

    const docs = client.originalData?.documentos_urls || []
    const docsText =
      docs.length > 0
        ? docs.map((d) => `- ${d.name}: ${d.url}`).join('\n')
        : 'Nenhum documento cadastral extra anexado.'

    const contratoText = client.contratoUrl ? `- Contrato Assinado: ${client.contratoUrl}` : ''

    const initialBody = `Bom dia, Gesualdo,

Temos um novo contrato formalizado e já podemos iniciar o processo de implantação do sistema.
Segue abaixo os dados do cliente e detalhamento do plano contratado:

Empresa: ${client.name}
CNPJ: ${formatCNPJ(client.cnpj)}
Regime Tributário: Simples Nacional (ME)

Perfil Operacional:
Transportadora com atuação em operações municipais, intermunicipais, interestaduais e internacionais, além de atividades de carga e descarga e locação de veículos com e sem condutor.

Plano Contratado:
${plan ? plan.name : client.plano_base || 'Não especificado'}

Módulos Inclusos no Plano:
${modulosInclusos.join('\n')}

Módulos Adicionais Contratados:
${modulosAdicionais}

Documentos Anexados para Abertura de Base:
${contratoText}
${docsText}

Responsável / Ponto Focal:
Nome: ${client.rep_nome || 'Não informado'} - Tel: ${client.originalData?.telefone || 'Não informado'}
E-mail: ${client.originalData?.email || 'Não informado'}

Peço, por gentileza, dar andamento no contato inicial com o cliente para alinhamento da agenda de implantação, levantamento de informações e início das configurações do sistema.

Fico à disposição para qualquer apoio necessário.
Obrigada,`

    setEmailBody(initialBody)
  }

  const onSubmit = async (data: ClientFormValues) => {
    const currentFiliaisDet = editingClient?.originalData?.modulos?.filiais_detalhes || []

    const payload = {
      nome: data.nome,
      cnpj: data.cnpj,
      email: data.email,
      telefone: data.telefone,
      endereco: data.endereco,
      rep_nome: data.rep_nome,
      rep_cpf: data.rep_cpf,
      rep_rg: data.rep_rg,
      valor_implantacao: data.valor_implantacao,
      modo_implantacao: data.modo_implantacao,
      valor_total: data.valor_total,
      desconto_mensalidade: data.desconto_mensalidade,
      tipo_desconto: data.tipo_desconto,
      cobrar_filiais: data.cobrar_filiais,
      quantidade_filiais: data.quantidade_filiais,
      filiais_detalhes: data.filiais_detalhes,
      data_assinatura: data.data_assinatura || null,
      vencimento_mensal: data.vencimento_mensal ?? null,
      modulos: {
        plano_base: data.plano_base,
        filiais: data.filiais,
        adicionais: data.modulos,
        filiais_detalhes: currentFiliaisDet,
      },
    }

    try {
      if (editingClient) {
        await updateCliente(editingClient.id, payload)
        toast.success('Cliente atualizado com sucesso!')
      } else {
        await createCliente(payload)
        toast.success('Cliente adicionado com sucesso!')
      }
      setIsSheetOpen(false)
      setEditingClient(null)
      form.reset()
      loadClientes()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao salvar cliente')
    }
  }

  const handleDelete = async () => {
    if (!clientToDelete) return

    try {
      await deleteCliente(clientToDelete.id)
      toast.success('Cliente excluído com sucesso!')
      setClientToDelete(null)
      loadClientes()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao excluir cliente')
    }
  }

  const handleConfirmCancel = async () => {
    if (!cancelClient || !cancelDate || !cancelMotivo.trim()) return

    setIsSubmittingCancel(true)
    try {
      await updateCliente(cancelClient.id, {
        status: 'inativo',
        data_cancelamento: cancelDate,
        motivo_cancelamento: cancelMotivo.trim(),
      })
      toast.success('Cancelamento registrado com sucesso!')
      setIsCancelModalOpen(false)
      setCancelClient(null)
      setCancelDate('')
      setCancelMotivo('')
      loadClientes()

      if (viewingClient && viewingClient.id === cancelClient.id) {
        setViewingClient({
          ...viewingClient,
          data_cancelamento: cancelDate,
          motivo_cancelamento: cancelMotivo.trim(),
          originalData: {
            ...viewingClient.originalData!,
            status: 'inativo',
            data_cancelamento: cancelDate,
            motivo_cancelamento: cancelMotivo.trim(),
          },
        })
      }
    } catch (error) {
      console.error(error)
      toast.error('Erro ao registrar cancelamento')
    } finally {
      setIsSubmittingCancel(false)
    }
  }

  const handleSaveSignatureLink = async () => {
    if (!signatureLinkClient) return
    try {
      await updateCliente(signatureLinkClient.id, { link_assinatura: signatureLinkValue || null })
      toast.success('Link de assinatura salvo com sucesso!')
      setIsSignatureLinkOpen(false)

      const updatedClient = {
        ...signatureLinkClient,
        link_assinatura: signatureLinkValue || null,
        originalData: {
          ...signatureLinkClient.originalData!,
          link_assinatura: signatureLinkValue || null,
        },
      }

      setSignatureLinkClient(null)
      loadClientes()

      if (viewingClient && viewingClient.id === updatedClient.id) {
        setViewingClient(updatedClient)
      }

      if (autoSendContractAfterLink) {
        setAutoSendContractAfterLink(false)
        handleSendContractEmail(updatedClient)
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar link de assinatura')
    }
  }

  const handleSendContractEmail = async (client: MergedClient) => {
    if (!client.originalData?.email) {
      toast.error('Cliente não possui e-mail cadastrado.')
      return
    }
    if (!client.link_assinatura) {
      toast.error('É necessário definir o link de assinatura antes de enviar.')
      setSignatureLinkClient(client)
      setSignatureLinkValue('')
      setAutoSendContractAfterLink(true)
      setIsSignatureLinkOpen(true)
      return
    }

    setIsSendingContract(true)
    const toastId = toast.loading('Enviando contrato para assinatura...')
    try {
      let contractUrl = client.contratoUrl || null
      if (contractUrl) {
        const { url } = await getSignedContractUrl(contractUrl)
        if (url) contractUrl = url
      }

      const { error } = await supabase.functions.invoke('send-contract-email', {
        body: {
          to: client.originalData.email,
          clientName: client.name,
          repName: client.rep_nome || '',
          signatureLink: client.link_assinatura,
          contractUrl: contractUrl,
        },
      })

      if (error) throw error

      toast.success('E-mail enviado com sucesso para ' + client.originalData.email, { id: toastId })

      await createHistorico({
        cliente_id: client.id,
        tipo: 'Contrato Enviado para Assinatura',
        observacoes: `E-mail de boas-vindas com link de assinatura enviado para ${client.originalData.email}.`,
        valor_total: client.totalValue,
      })

      if (viewingClient && viewingClient.id === client.id) {
        loadHistory(client.id)
      }
    } catch (err: any) {
      toast.error('Erro ao enviar e-mail: ' + (err.message || 'Falha desconhecida'), {
        id: toastId,
      })
    } finally {
      setIsSendingContract(false)
    }
  }

  const handleActionSendImplementation = async (client: MergedClient) => {
    setIsSendingImplementation(true)
    const toastId = toast.loading('Enviando e-mail para implantação...')
    try {
      let senderName = 'Equipe'
      if (user?.id) {
        const { data: colab } = await supabase
          .from('colaboradores')
          .select('nome')
          .eq('user_id', user.id)
          .maybeSingle()
        if (colab) senderName = colab.nome
      }

      const modulosList =
        client.modules && client.modules.length > 0
          ? client.modules.map((m) => `- ${m.name}`).join('\n')
          : 'Nenhum módulo adicional especificado'

      const { error } = await supabase.functions.invoke('send-implementation-email', {
        body: {
          to: 'gesualdo@servicelogic.com.br',
          clientName: client.name,
          contactName: client.rep_nome || '',
          contactPhone: client.originalData?.telefone || '',
          modules: modulosList,
          senderName,
        },
      })

      if (error) throw error

      await createHistorico({
        cliente_id: client.id,
        tipo: 'Notificação Enviada',
        observacoes: 'E-mail para implantação enviado pelo painel do cliente.',
        valor_total: client.totalValue,
      })

      toast.success('E-mail enviado para implantação com sucesso!', { id: toastId })
      loadHistory(client.id)
    } catch (e: any) {
      toast.error('Erro ao enviar e-mail: ' + (e.message || 'Falha desconhecida'), { id: toastId })
    } finally {
      setIsSendingImplementation(false)
    }
  }

  const handleActionSendFinanceiro = async (client: MergedClient) => {
    setIsSendingFinanceiro(true)
    const toastId = toast.loading('Enviando e-mail para financeiro...')
    try {
      const modulosList =
        client.modules && client.modules.length > 0
          ? client.modules.map((m) => m.name).join(', ')
          : 'Nenhum módulo adicional'

      const { error } = await supabase.functions.invoke('send-finance-email', {
        body: {
          to: 'financeiro@servicelogic.com.br',
          clientName: client.name,
          moduleName: modulosList,
          type: 'novo_contrato',
        },
      })

      if (error) throw error

      await createHistorico({
        cliente_id: client.id,
        tipo: 'Notificação Enviada',
        observacoes: 'E-mail para financeiro enviado pelo painel do cliente.',
        valor_total: client.totalValue,
      })

      toast.success('E-mail enviado para financeiro com sucesso!', { id: toastId })
      loadHistory(client.id)
    } catch (e: any) {
      toast.error('Erro ao enviar e-mail: ' + (e.message || 'Falha desconhecida'), { id: toastId })
    } finally {
      setIsSendingFinanceiro(false)
    }
  }

  const handleSaveFilial = async () => {
    if (!viewingClient) return
    setIsSubmittingAditivo(true)
    try {
      let currentModulosRaw = viewingClient.originalData?.modulos || {
        plano_base: viewingClient.plano_base,
        filiais: viewingClient.filiais,
        adicionais: viewingClient.modules,
      }

      if (Array.isArray(currentModulosRaw)) {
        currentModulosRaw = {
          plano_base: viewingClient.plano_base,
          filiais: viewingClient.filiais,
          adicionais: currentModulosRaw,
        }
      }

      const currentFiliaisDet = currentModulosRaw.filiais_detalhes || []

      const novaFilial = {
        id: crypto.randomUUID(),
        nome: filialForm.nome,
        cnpj: filialForm.cnpj,
        dfe_incluso: filialForm.dfe_incluso,
        valor_mensalidade: filialForm.valor_mensalidade,
        valor_dfe: filialForm.dfe_incluso ? filialForm.valor_dfe : 0,
      }

      const valorTotalFilial =
        novaFilial.valor_mensalidade + (novaFilial.dfe_incluso ? novaFilial.valor_dfe || 0 : 0)

      const novasAdicoes = [
        {
          name: `Filial: ${novaFilial.nome} (${formatCNPJ(novaFilial.cnpj)})`,
          price: novaFilial.valor_mensalidade,
        },
      ]
      if (novaFilial.dfe_incluso) {
        novasAdicoes.push({
          name: `DF-e (Filial: ${novaFilial.nome})`,
          price: novaFilial.valor_dfe || 0,
        })
      }

      const updatedAdicionais = [...(currentModulosRaw.adicionais || []), ...novasAdicoes]

      const updatedModulos = {
        ...currentModulosRaw,
        filiais_detalhes: [...currentFiliaisDet, novaFilial],
        adicionais: updatedAdicionais,
      }

      const novoValorTotal = viewingClient.totalValue + valorTotalFilial

      await updateCliente(viewingClient.id, {
        modulos: updatedModulos,
        valor_total: novoValorTotal,
        filiais_detalhes: [...(viewingClient.originalData?.filiais_detalhes || []), novaFilial],
        quantidade_filiais: (viewingClient.originalData?.quantidade_filiais || 0) + 1,
      })

      const modulosAditivo = [
        {
          name: `inclusão de uma nova filial - CNPJ ${formatCNPJ(novaFilial.cnpj)}`,
          price: novaFilial.valor_mensalidade,
        },
      ]
      if (novaFilial.dfe_incluso) {
        modulosAditivo.push({
          name: `inclusão do DF-e para a filial - CNPJ ${formatCNPJ(novaFilial.cnpj)}`,
          price: novaFilial.valor_dfe || 0,
        })
      }

      await createHistorico({
        cliente_id: viewingClient.id,
        tipo: 'Aditivo de Filial',
        data_solicitacao: new Date().toISOString().split('T')[0],
        observacoes: `Adição de Filial: ${novaFilial.nome} (CNPJ: ${novaFilial.cnpj}). DF-e: ${novaFilial.dfe_incluso ? `Sim (${formatCurrency(novaFilial.valor_dfe || 0)})` : 'Não'}`,
        valor_adicional: valorTotalFilial,
        valor_total: novoValorTotal,
        modulos: modulosAditivo,
      })

      toast.success('Filial adicionada com sucesso e aditivo gerado!')
      setIsAddFilialOpen(false)
      setFilialForm({
        nome: '',
        cnpj: '',
        dfe_incluso: false,
        valor_mensalidade: 199.0,
        valor_dfe: 49.9,
      })

      loadClientes()
      loadHistory(viewingClient.id)

      setViewingClient((prev) =>
        prev
          ? {
              ...prev,
              modules: [...prev.modules, ...novasAdicoes],
              totalValue: novoValorTotal,
              filiais_detalhes: [...(prev.filiais_detalhes || []), novaFilial],
              originalData: {
                ...prev.originalData!,
                modulos: updatedModulos,
                valor_total: novoValorTotal,
              },
            }
          : null,
      )
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar filial')
    } finally {
      setIsSubmittingAditivo(false)
    }
  }

  const handleSaveAditivo = async () => {
    if (!viewingClient || selectedNewModules.length === 0) return
    setIsSubmittingAditivo(true)
    try {
      const novos = selectedNewModules
        .map((id) => MODULES.find((m) => m.id === id)!)
        .filter(Boolean)
      const valorAdicional = novos.reduce((acc, m) => acc + m.price, 0)
      const novoValorTotal = viewingClient.totalValue + valorAdicional

      let currentModulosRaw = viewingClient.originalData?.modulos || {
        plano_base: '',
        filiais: 0,
        adicionais: [],
      }
      if (Array.isArray(currentModulosRaw)) {
        currentModulosRaw = {
          plano_base: viewingClient.plano_base,
          filiais: viewingClient.filiais,
          adicionais: currentModulosRaw,
        }
      }

      const updatedAdicionais = [
        ...(currentModulosRaw.adicionais || []),
        ...novos.map((m) => ({ name: m.name, price: m.price })),
      ]
      const updatedModulos = {
        ...currentModulosRaw,
        adicionais: updatedAdicionais,
      }

      await updateCliente(viewingClient.id, {
        modulos: updatedModulos,
        valor_total: novoValorTotal,
      })

      await createHistorico({
        cliente_id: viewingClient.id,
        tipo: 'Aditivo de Módulos',
        data_solicitacao: aditivoDate,
        modulos: novos,
        valor_adicional: valorAdicional,
        valor_total: novoValorTotal,
        observacoes: `Adição de ${novos.length} módulo(s)`,
      })

      toast.success('Aditivo registrado com sucesso e contrato atualizado!')
      setIsAddModuleOpen(false)
      setSelectedNewModules([])
      setAditivoDate(new Date().toISOString().split('T')[0])

      loadClientes()
      loadHistory(viewingClient.id)

      setViewingClient((prev) =>
        prev
          ? {
              ...prev,
              modules: [...prev.modules, ...novos.map((m) => ({ name: m.name, price: m.price }))],
              totalValue: novoValorTotal,
              originalData: {
                ...prev.originalData!,
                modulos: updatedModulos,
                valor_total: novoValorTotal,
              },
            }
          : null,
      )
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar aditivo')
    } finally {
      setIsSubmittingAditivo(false)
    }
  }

  const handleSaveSolicitacao = async () => {
    if (!viewingClient) return

    if (!solicitacaoDescricao.trim()) {
      toast.error('A descrição do serviço é obrigatória')
      return
    }

    const parsedValor = solicitacaoValor === '' ? null : Number(solicitacaoValor)
    if (parsedValor !== null && isNaN(parsedValor)) {
      toast.error('O valor informado é inválido')
      return
    }

    setIsSubmittingSolicitacao(true)
    try {
      let docUrl = solicitacaoDocumentoUrl || null
      if (solicitacaoDocumentoFile) {
        const fileExt = solicitacaoDocumentoFile.name.split('.').pop()
        const fileName = `${viewingClient.id}/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('client-files')
          .upload(fileName, solicitacaoDocumentoFile, { upsert: true })
        if (uploadError) throw uploadError
        const { data: publicUrlData } = supabase.storage.from('client-files').getPublicUrl(fileName)
        docUrl = publicUrlData.publicUrl
      }

      if (editingSolicitacaoId) {
        await updateSolicitacao(editingSolicitacaoId, {
          tipo: solicitacaoTipo,
          descricao: solicitacaoDescricao.trim(),
          data_solicitacao: solicitacaoData || null,
          valor: parsedValor,
          forma_pagamento: solicitacaoFormaPagamento || null,
          data_vencimento: solicitacaoDataVencimento || null,
          observacoes: solicitacaoObservacoes.trim() || null,
          contato_nome: solicitacaoContatoNome.trim() || null,
          contato_telefone: solicitacaoContatoTelefone.trim() || null,
          documento_url: docUrl,
        })
        toast.success('Solicitação atualizada com sucesso!')
      } else {
        await createSolicitacao({
          cliente_id: viewingClient.id,
          tipo: solicitacaoTipo,
          descricao: solicitacaoDescricao.trim(),
          data_solicitacao: solicitacaoData || null,
          valor: parsedValor,
          forma_pagamento: solicitacaoFormaPagamento || null,
          data_vencimento: solicitacaoDataVencimento || null,
          observacoes: solicitacaoObservacoes.trim() || null,
          contato_nome: solicitacaoContatoNome.trim() || null,
          contato_telefone: solicitacaoContatoTelefone.trim() || null,
          documento_url: docUrl,
          status: 'Pendente',
        })
        toast.success('Solicitação registrada com sucesso!')
      }

      setIsAddSolicitacaoOpen(false)
      await loadSolicitacoes(viewingClient.id)
      await loadHistory(viewingClient.id)

      resetSolicitacaoForm()
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Erro ao salvar solicitação. Verifique os dados.')
    } finally {
      setIsSubmittingSolicitacao(false)
    }
  }

  const handleOpenEditSolicitacao = (sol: any) => {
    setEditingSolicitacaoId(sol.id)
    setSolicitacaoTipo(sol.tipo || 'Treinamento')
    setSolicitacaoDescricao(sol.descricao || '')
    setSolicitacaoData(sol.data_solicitacao || '')
    setSolicitacaoValor(sol.valor ?? '')
    setSolicitacaoFormaPagamento(sol.forma_pagamento || 'Boleto')
    setSolicitacaoDataVencimento(sol.data_vencimento || '')
    setSolicitacaoObservacoes(sol.observacoes || '')
    setSolicitacaoContatoNome(sol.contato_nome || '')
    setSolicitacaoContatoTelefone(sol.contato_telefone || '')
    setSolicitacaoDocumentoFile(null)
    setSolicitacaoDocumentoUrl(sol.documento_url || '')
    setIsAddSolicitacaoOpen(true)
  }

  const handleDeleteSolicitacao = async (id: string) => {
    if (!viewingClient) return
    try {
      await deleteSolicitacao(id)
      toast.success('Solicitação excluída')
      await loadSolicitacoes(viewingClient.id)
      await loadHistory(viewingClient.id)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir solicitação')
    }
  }

  const handleEmailImplantacao = async (sol: any) => {
    if (!viewingClient) return

    const toastId = toast.loading('Enviando e-mail para implantação...')
    try {
      let senderName = 'Equipe'
      if (user?.id) {
        const { data: colab } = await supabase
          .from('colaboradores')
          .select('nome')
          .eq('user_id', user.id)
          .maybeSingle()
        if (colab) senderName = colab.nome
      }

      const modulosList =
        viewingClient.modules && viewingClient.modules.length > 0
          ? viewingClient.modules.map((m) => `- ${m.name}`).join('\n')
          : 'Nenhum módulo adicional especificado (verificar plano base)'

      const res = await supabase.functions.invoke('send-implementation-email', {
        body: {
          to: 'gesualdo@servicelogic.com.br',
          clientName: viewingClient.name,
          contactName: sol.contato_nome || viewingClient.rep_nome,
          contactPhone: sol.contato_telefone || viewingClient.originalData?.telefone,
          modules: modulosList,
          senderName: senderName,
        },
      })

      if (res.error) throw res.error

      await createHistorico({
        cliente_id: viewingClient.id,
        tipo: 'Notificação Enviada',
        observacoes: `E-mail para implantação enviado com sucesso referente à solicitação: ${sol.tipo}`,
        valor_total: viewingClient.totalValue,
      })

      await updateSolicitacao(sol.id, { status: 'Enviado p/ Implantação' })

      toast.success('E-mail enviado para implantação com sucesso!', { id: toastId })
      loadSolicitacoes(viewingClient.id)
      loadHistory(viewingClient.id)
    } catch (e: any) {
      toast.error('Erro ao enviar e-mail: ' + e.message, { id: toastId })
    }
  }

  const handleGenerateTrainingProposal = async () => {
    if (!viewingClient) return

    const data = {
      clientName: viewingClient.name,
      cnpj: viewingClient.cnpj,
      email: viewingClient.originalData?.email || '',
      contato: viewingClient.rep_nome || '',
      date: new Date().toISOString(),
      price: trainingPrice,
      modules: selectedTrainingModules.map((m) => ({
        name: m,
        features: TRAINING_FEATURES[m] || [],
      })),
    }

    try {
      await createHistorico({
        cliente_id: viewingClient.id,
        tipo: 'Proposta de Treinamento',
        data_solicitacao: new Date().toISOString().split('T')[0],
        observacoes: `Proposta gerada para os módulos: ${selectedTrainingModules.join(', ')}. Valor: R$ ${trainingPrice.toFixed(2)}`,
        valor_total: viewingClient.totalValue,
      })

      await createSolicitacao({
        cliente_id: viewingClient.id,
        tipo: 'Proposta de Treinamento',
        descricao: `Proposta gerada para os módulos: ${selectedTrainingModules.join(', ')}`,
        valor: trainingPrice,
        status: 'Pendente',
      })

      if (flagNotifyImplantacao) {
        await createSolicitacao({
          cliente_id: viewingClient.id,
          tipo: 'Treinamento',
          descricao: `Agendamento automático via Proposta.\nMódulos: ${selectedTrainingModules.join(', ')}`,
          status: 'Pendente',
        })
        await createHistorico({
          cliente_id: viewingClient.id,
          tipo: 'Notificação Enviada',
          observacoes: 'Solicitação de agendamento de treinamento enviada automaticamente.',
        })
      }

      if (flagNotifyFinanceiro) {
        await createSolicitacao({
          cliente_id: viewingClient.id,
          tipo: 'Outro',
          descricao: `Faturamento automático via Proposta.\nMódulos: ${selectedTrainingModules.join(', ')}`,
          valor: trainingPrice,
          status: 'Pendente',
        })
        await createHistorico({
          cliente_id: viewingClient.id,
          tipo: 'Notificação Enviada',
          observacoes: 'Solicitação de faturamento enviada automaticamente ao financeiro.',
        })
      }

      loadHistory(viewingClient.id)
      loadSolicitacoes(viewingClient.id)
      toast.success('Proposta gerada com sucesso e ações executadas!')
    } catch (e) {
      console.error('Erro ao salvar histórico/solicitação de proposta', e)
    }

    setViewingTrainingProposal(data)
    setIsSetupTrainingProposalOpen(false)
    setSelectedTrainingModules([])
    setTrainingPrice(0)
    setFlagNotifyImplantacao(false)
    setFlagNotifyFinanceiro(false)
  }

  const handleEmailFinanceiro = (sol: any) => {
    const subject = encodeURIComponent(`Faturamento de ${sol.tipo} - ${viewingClient?.name}`)
    const body = encodeURIComponent(`Boa tarde, tudo bem?

Peço por gentileza que seja realizada a cobrança referente ao serviço abaixo:

Cliente: ${viewingClient?.name}
Responsável: ${viewingClient?.rep_nome || 'Não informado'}
Telefone: ${viewingClient?.originalData?.telefone || 'Não informado'}

Serviço contratado:
${sol.descricao}

Valor:
R$ ${sol.valor ? sol.valor.toFixed(2).replace('.', ',') : '0,00'}

Forma de pagamento:
${sol.forma_pagamento || 'Não informada'}

Data de Vencimento:
${sol.data_vencimento ? formatDate(sol.data_vencimento) : 'Não informada'}

Observações:
${sol.observacoes || 'Nenhuma'}

Peço por gentileza que sigam com o faturamento/cobrança junto ao cliente.

Obrigada.`)

    window.open(`mailto:financeiro@servicelogic.com.br?subject=${subject}&body=${body}`, '_blank')
  }

  const handlePrintAddendum = () => {
    const printContent = document.getElementById('addendum-print-area')
    if (printContent) {
      const originalContents = document.body.innerHTML
      document.body.innerHTML = printContent.innerHTML
      window.print()
      document.body.innerHTML = originalContents
      window.location.reload()
    }
  }

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-excel`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: formData,
        },
      )

      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'Erro ao processar arquivo Excel')

      const allSheetsData = result.data
      let totalImported = 0
      let totalUpdated = 0

      const existingClients = await fetchClientes()
      const mergedClientsMap = new Map<string, any>()

      for (const sheetName of Object.keys(allSheetsData)) {
        const rows = allSheetsData[sheetName] as any[][]
        if (rows.length <= 1) continue

        const headers = rows[0].map((h) =>
          String(h || '')
            .toLowerCase()
            .trim(),
        )
        const isModulosSheet = sheetName.toLowerCase().includes('modulo')

        const idxNome = headers.findIndex(
          (h) =>
            h.includes('nome') ||
            h.includes('razão') ||
            h.includes('razao') ||
            h.includes('empresa') ||
            h.includes('cliente'),
        )
        const idxCnpj = headers.findIndex((h) => h.includes('cnpj'))
        const idxEmail = headers.findIndex((h) => h.includes('email') || h.includes('e-mail'))
        const idxTelefone = headers.findIndex(
          (h) => h.includes('telefone') || h.includes('celular') || h.includes('contato'),
        )
        const idxModulos = headers.findIndex(
          (h) =>
            h.includes('modulo') ||
            h.includes('módulo') ||
            h.includes('plano') ||
            h.includes('serviço'),
        )
        const idxValor = headers.findIndex(
          (h) =>
            h.includes('valor') ||
            h.includes('mensalidade') ||
            h.includes('total') ||
            h.includes('liquido') ||
            h.includes('líquido') ||
            h.includes('vi liquido'),
        )
        const idxDataVenc = headers.findIndex(
          (h) => h.includes('data venc') || h.includes('vencimento'),
        )

        const moduleHeaders: { index: number; id: string }[] = []
        if (isModulosSheet || idxModulos === -1) {
          headers.forEach((h, idx) => {
            const found = MODULES.find((m) => m.name.toLowerCase() === h)
            if (found) moduleHeaders.push({ index: idx, id: found.name })
          })
        }

        if (idxNome === -1 && idxCnpj === -1) {
          toast.warning(
            `Aba "${sheetName}" ignorada: não possui coluna identificadora (CNPJ ou Nome).`,
          )
          continue
        }

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i]

          let rawCnpj = idxCnpj !== -1 ? String(row[idxCnpj] || '') : ''
          let nome = idxNome !== -1 ? String(row[idxNome] || '').trim() : ''

          let cnpj = rawCnpj.replace(/\D/g, '')

          if (!cnpj && nome) {
            const cnpjMatch = nome.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/)
            if (cnpjMatch) {
              cnpj = cnpjMatch[0].replace(/\D/g, '')
              nome = nome
                .replace(cnpjMatch[0], '')
                .replace(/\s*-\s*$/, '')
                .trim()
            } else {
              const digitsMatch = nome.match(/\b\d{14}\b/)
              if (digitsMatch) {
                cnpj = digitsMatch[0]
                nome = nome
                  .replace(digitsMatch[0], '')
                  .replace(/\s*-\s*$/, '')
                  .trim()
              }
            }
          }

          if (cnpj && cnpj.length < 14) {
            cnpj = cnpj.padStart(14, '0')
          }

          const identifier = cnpj || nome.toLowerCase()
          if (!identifier) continue

          const existing = mergedClientsMap.get(identifier) || {
            nome: '',
            cnpj: '',
            email: '',
            telefone: '',
            modulos: [],
            valor_total: 0,
            cobrancas: [],
          }

          if (nome && !existing.nome) existing.nome = nome
          if (cnpj && !existing.cnpj) existing.cnpj = cnpj

          if (idxEmail !== -1 && row[idxEmail]) existing.email = String(row[idxEmail]).trim()
          if (idxTelefone !== -1 && row[idxTelefone])
            existing.telefone = String(row[idxTelefone]).trim()

          if (idxModulos !== -1 && row[idxModulos]) {
            const modulosStr = String(row[idxModulos])
            const parsedModulos = modulosStr
              .split(/[,;+&]/)
              .map((s) => s.trim())
              .filter(Boolean)

            parsedModulos.forEach((mName) => {
              const mLower = mName.toLowerCase()
              const found = MODULES.find(
                (m) => m.name.toLowerCase() === mLower || mLower.includes(m.name.toLowerCase()),
              )
              if (
                found &&
                !existing.modulos.some((ex: any) =>
                  typeof ex === 'string' ? ex === found.name : ex.name === found.name,
                )
              ) {
                existing.modulos.push({ name: found.name, price: found.price })
              }
            })
          }

          moduleHeaders.forEach(({ index, id }) => {
            const val = String(row[index] || '')
              .toLowerCase()
              .trim()
            if (['sim', 'x', '1', 'true', 'ok', 'contratado'].includes(val)) {
              const mod = MODULES.find((m) => m.name === id || m.id === id)
              if (
                mod &&
                !existing.modulos.some((ex: any) =>
                  typeof ex === 'string' ? ex === id : ex.name === id,
                )
              ) {
                existing.modulos.push({ name: id, price: mod.price })
              }
            }
          })

          let parsedValor = 0
          if (idxValor !== -1 && row[idxValor]) {
            const rawValor = String(row[idxValor]).replace(/[R$\s]/gi, '')
            if (rawValor.includes(',')) {
              parsedValor = parseFloat(rawValor.replace(/\./g, '').replace(',', '.'))
            } else {
              parsedValor = parseFloat(rawValor)
            }

            if (!isNaN(parsedValor) && parsedValor > 0) {
              existing.valor_total = parsedValor
            }
          }

          let parsedDataVenc = ''
          if (idxDataVenc !== -1 && row[idxDataVenc]) {
            parsedDataVenc = String(row[idxDataVenc]).trim()
            if (parsedDataVenc.includes('T')) {
              parsedDataVenc = parsedDataVenc.split('T')[0]
            } else if (parsedDataVenc.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
              const [d, m, y] = parsedDataVenc.split('/')
              parsedDataVenc = `${y}-${m}-${d}`
            }
          }

          if (parsedDataVenc && !isNaN(parsedValor) && parsedValor > 0) {
            existing.cobrancas = existing.cobrancas || []
            if (
              !existing.cobrancas.some(
                (c: any) => c.data_vencimento === parsedDataVenc && c.valor === parsedValor,
              )
            ) {
              existing.cobrancas.push({
                data_vencimento: parsedDataVenc,
                valor: parsedValor,
              })
            }
          }

          mergedClientsMap.set(identifier, existing)
        }
      }

      const newClients: any[] = []
      const updatedClients: any[] = []

      for (const [identifier, payload] of mergedClientsMap.entries()) {
        if (!payload.cnpj) {
          payload.cnpj = `00000000${Math.floor(100000 + Math.random() * 900000)}`
        }
        if (!payload.nome) {
          payload.nome = 'Cliente Sem Nome'
        }

        if (payload.cobrancas && payload.cobrancas.length > 0) {
          payload.valor_total = payload.cobrancas.reduce((acc: number, c: any) => acc + c.valor, 0)
        } else if (payload.valor_total === 0 && payload.modulos.length > 0) {
          let calculatedTotal = 0
          payload.modulos.forEach((modItem: any) => {
            if (typeof modItem === 'string') {
              const mod = MODULES.find((m: any) => m.name === modItem)
              if (mod) calculatedTotal += mod.price
            } else if (modItem.price) {
              calculatedTotal += modItem.price
            }
          })
          payload.valor_total = calculatedTotal
        }

        const normalizeStr = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ')
        const pNomeNorm = normalizeStr(payload.nome || '')
        const pCnpjNorm = payload.cnpj ? payload.cnpj.replace(/\D/g, '') : ''

        const existing = existingClients.find((c) => {
          const cCnpjNorm = c.cnpj ? c.cnpj.replace(/\D/g, '') : ''
          const cNomeNorm = normalizeStr(c.nome || '')

          if (pCnpjNorm && pCnpjNorm !== '00000000000000' && cCnpjNorm === pCnpjNorm) return true
          if (cNomeNorm && pNomeNorm && cNomeNorm === pNomeNorm) return true
          if (
            cNomeNorm &&
            pNomeNorm &&
            pNomeNorm.length > 5 &&
            (cNomeNorm.includes(pNomeNorm) || pNomeNorm.includes(cNomeNorm))
          )
            return true
          return false
        })

        let mergedMods: any = { plano_base: '', filiais: 0, adicionais: payload.modulos }
        if (existing) {
          let existingAdicionais: any[] = []
          if (Array.isArray(existing.modulos)) {
            existingAdicionais = existing.modulos
          } else if (existing.modulos && typeof existing.modulos === 'object') {
            existingAdicionais = (existing.modulos as any).adicionais || []
          }

          const combined = [...existingAdicionais, ...payload.modulos]
          const uniqueAdicionais = combined.filter(
            (item, index, self) =>
              index ===
              self.findIndex(
                (t) =>
                  (typeof t === 'string' ? t : t.name) ===
                  (typeof item === 'string' ? item : item.name),
              ),
          )

          mergedMods = {
            plano_base: (existing.modulos as any)?.plano_base || '',
            filiais: (existing.modulos as any)?.filiais || 0,
            adicionais: uniqueAdicionais,
          }

          const existingCobrancas = Array.isArray(existing.cobrancas) ? existing.cobrancas : []
          const payloadCobrancas = Array.isArray(payload.cobrancas) ? payload.cobrancas : []

          const combinedCobrancas = [...existingCobrancas]
          payloadCobrancas.forEach((pc: any) => {
            const exists = combinedCobrancas.some(
              (ec: any) => ec.data_vencimento === pc.data_vencimento && ec.valor === pc.valor,
            )
            if (!exists) {
              combinedCobrancas.push(pc)
            }
          })

          let finalCobrancas = combinedCobrancas
          let finalValorTotal = 0

          if (payloadCobrancas.length > 0) {
            finalValorTotal = combinedCobrancas.reduce((acc: number, c: any) => acc + c.valor, 0)
          } else if (payload.valor_total > 0) {
            finalValorTotal = payload.valor_total
            finalCobrancas = [] // Limpa cobranças antigas se estamos apenas importando um novo valor total consolidado
          } else {
            finalValorTotal =
              combinedCobrancas.length > 0
                ? combinedCobrancas.reduce((acc: number, c: any) => acc + c.valor, 0)
                : existing.valor_total || 0
          }

          updatedClients.push({
            id: existing.id,
            nome: existing.nome, // Mantém o nome original da base
            cnpj: payload.cnpj !== '00000000000000' && payload.cnpj ? payload.cnpj : existing.cnpj,
            email: payload.email || existing.email,
            telefone: payload.telefone || existing.telefone,
            modulos: mergedMods,
            valor_total: finalValorTotal,
            cobrancas: finalCobrancas,
          })
        } else {
          newClients.push({
            nome: payload.nome,
            cnpj: payload.cnpj,
            email: payload.email,
            telefone: payload.telefone,
            valor_total: payload.valor_total,
            modulos: mergedMods,
            cobrancas: payload.cobrancas || [],
          })
        }
      }

      const batchSize = 50

      if (newClients.length > 0) {
        for (let i = 0; i < newClients.length; i += batchSize) {
          const batch = newClients.slice(i, i + batchSize)
          const { error } = await supabase.from('clientes').insert(batch)
          if (error) throw error
          totalImported += batch.length
        }
      }

      if (updatedClients.length > 0) {
        for (let i = 0; i < updatedClients.length; i += batchSize) {
          const batch = updatedClients.slice(i, i + batchSize)
          await Promise.all(
            batch.map((client) => {
              const { id, ...rest } = client
              return supabase.from('clientes').update(rest).eq('id', id)
            }),
          )
          totalUpdated += batch.length
        }
      }

      toast.success(`Importação concluída! ${totalImported} criados, ${totalUpdated} atualizados.`)
      loadClientes()
    } catch (error: any) {
      console.error(error)
      toast.error('Falha ao importar arquivo: ' + error.message)
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const mergedClients: MergedClient[] = [
    ...clientes.map((c) => {
      const clientReceipts = receipts.filter(
        (r) =>
          r.cliente_id === c.id ||
          (r.cnpj && r.cnpj.replace(/\D/g, '') === (c.cnpj || '').replace(/\D/g, '')),
      )
      const stats = calculateFinancialScore(clientReceipts)

      let parsedModules: ModuleItem[] = []
      let plano_base = ''
      let filiais = 0
      let filiais_detalhes: FilialDetalhe[] = []

      const formatMod = (m: any): ModuleItem | null => {
        if (!m) return null
        if (typeof m === 'object') {
          if (m.ativo === false || m.selected === false || m.value === false) return null
        }

        const mName = typeof m === 'string' ? m : m.name || ''
        if (!mName) return null

        const mPrice = typeof m === 'string' ? undefined : m.price

        const modDef = MODULES.find(
          (x) => x.name.toLowerCase() === mName.toLowerCase() || x.id === mName,
        )

        if (!modDef) {
          if (mPrice !== undefined) {
            return { name: mName, price: mPrice }
          }
          return null
        }

        return {
          name: modDef.name,
          price: mPrice !== undefined ? mPrice : modDef.price,
        }
      }

      if (Array.isArray(c.modulos)) {
        parsedModules = c.modulos.map(formatMod).filter(Boolean) as ModuleItem[]
      } else if (c.modulos && typeof c.modulos === 'object') {
        const modObj = c.modulos as any
        parsedModules = (modObj.adicionais || []).map(formatMod).filter(Boolean) as ModuleItem[]
        plano_base = modObj.plano_base || ''
        filiais = modObj.filiais || 0
        filiais_detalhes = modObj.filiais_detalhes || []

        // Auto-inject legacy filiais_detalhes into modules if they are not already there
        filiais_detalhes.forEach((f) => {
          const filialName = `Filial: ${f.nome} (${formatCNPJ(f.cnpj)})`
          const dfeName = `DF-e (Filial: ${f.nome})`

          if (!parsedModules.some((m) => m.name === filialName)) {
            parsedModules.push({ name: filialName, price: f.valor_mensalidade })
          }
          if (f.dfe_incluso && !parsedModules.some((m) => m.name === dfeName)) {
            parsedModules.push({ name: dfeName, price: f.valor_dfe || 0 })
          }
        })
      }

      return {
        id: c.id,
        name: c.nome,
        cnpj: c.cnpj,
        endereco: c.endereco,
        rep_nome: c.rep_nome,
        rep_cpf: c.rep_cpf,
        rep_rg: c.rep_rg,
        valor_implantacao: c.valor_implantacao,
        modo_implantacao: c.modo_implantacao,
        modules: parsedModules,
        plano_base,
        filiais,
        filiais_detalhes,
        totalValue: c.valor_total || 0,
        createdAt: c.created_at,
        isMock: false,
        originalData: c,
        contratoUrl: c.contrato_url,
        stats,
        cobrancas: Array.isArray(c.cobrancas) ? c.cobrancas : [],
        tags: Array.isArray(c.tags) ? c.tags : [],
        desconto_mensalidade: c.desconto_mensalidade || 0,
        tipo_desconto: (c.tipo_desconto as 'valor' | 'percentual') || 'valor',
        data_assinatura: c.data_assinatura,
        vencimento_mensal: c.vencimento_mensal,
        data_cancelamento: c.data_cancelamento,
        motivo_cancelamento: c.motivo_cancelamento,
        link_assinatura: c.link_assinatura,
      }
    }),
  ]

  const filteredClients = mergedClients
    .filter(
      (c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.cnpj.includes(searchTerm),
    )
    .filter((c) => {
      if (filterType === 'with_contract')
        return c.totalValue > 0 || c.modules.length > 0 || c.plano_base
      if (filterType === 'without_contract')
        return c.totalValue === 0 && c.modules.length === 0 && !c.plano_base
      return true
    })
    .sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.name.localeCompare(b.name)
      }
      return b.name.localeCompare(a.name)
    })

  const availableModulesForAddendum = MODULES.filter(
    (m) => !(viewingClient?.modules || []).some((existing) => existing.name === m.name),
  )

  const ClientDetailsPanel = ({ client }: { client: MergedClient }) => {
    const plan = PLANS.find((p) => p.id === client.plano_base || p.name === client.plano_base)

    return (
      <div className="mt-6 space-y-8">
        {/* CNPJs Vinculados */}
        <div>
          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-500" /> CNPJs Vinculados
          </h4>
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-3 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[10px] uppercase"
                >
                  Matriz
                </Badge>
                <span className="font-mono text-sm font-medium text-slate-900">
                  {formatCNPJ(client.cnpj)}
                </span>
              </div>
            </div>
            {client.filiais_detalhes && client.filiais_detalhes.length > 0 && (
              <div className="p-3 space-y-2">
                {client.filiais_detalhes.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-2 pl-4">
                    <Badge
                      variant="outline"
                      className="bg-amber-50 text-amber-700 border-amber-100 text-[10px] uppercase"
                    >
                      Filial
                    </Badge>
                    <span className="font-mono text-xs text-slate-600">{formatCNPJ(f.cnpj)}</span>
                    {f.nome && <span className="text-xs text-slate-400 truncate">— {f.nome}</span>}
                  </div>
                ))}
              </div>
            )}
            {(!client.filiais_detalhes || client.filiais_detalhes.length === 0) && (
              <div className="p-3 text-xs text-slate-400 italic">
                Nenhuma filial vinculada a este cliente.
              </div>
            )}
          </div>
        </div>

        {/* Link de Assinatura */}
        <div>
          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <PenLine className="h-4 w-4 text-violet-500" /> Assinatura Eletrônica
          </h4>
          <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
            {client.link_assinatura ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  <a
                    href={client.link_assinatura}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-violet-600 hover:underline truncate"
                  >
                    {client.link_assinatura}
                  </a>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-500 hover:text-violet-600 shrink-0 h-7"
                  onClick={() => {
                    setSignatureLinkClient(client)
                    setSignatureLinkValue(client.link_assinatura || '')
                    setIsSignatureLinkOpen(true)
                  }}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 italic">
                  Nenhum link de assinatura definido.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-violet-600 border-violet-200 hover:bg-violet-50 h-7"
                  onClick={() => {
                    setSignatureLinkClient(client)
                    setSignatureLinkValue('')
                    setIsSignatureLinkOpen(true)
                  }}
                >
                  <PenLine className="h-3.5 w-3.5 mr-1.5" /> Definir Link
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Cancelamento */}
        {client.originalData?.status?.toLowerCase() === 'inativo' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-sm font-bold text-red-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Ban className="h-4 w-4" /> Contrato Cancelado
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-red-600 font-medium min-w-[140px]">
                  Data do Cancelamento:
                </span>
                <span className="text-slate-700">
                  {client.data_cancelamento
                    ? formatDate(client.data_cancelamento)
                    : 'Não informada'}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-red-600 font-medium min-w-[140px]">Motivo:</span>
                <span className="text-slate-700">
                  {client.motivo_cancelamento || 'Não informado'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Resumo Atual */}
        <div>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" /> Pacote Contratado Vigente
            </h4>
            <div className="flex items-center gap-2">
              {client.stats && client.stats.relevantTitulos > 0 && (
                <Badge variant="outline" className={`${client.stats.color}`}>
                  {client.stats.classification} (Score: {client.stats.score})
                </Badge>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddFilialOpen(true)}
                className="bg-white hover:bg-slate-50 shadow-sm"
              >
                <Building2 className="h-4 w-4 mr-1.5" /> Filial
              </Button>
              <Button
                size="sm"
                onClick={() => setIsAddModuleOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 shadow-sm"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Módulo
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-4 justify-between items-center">
              <div>
                <span className="text-xs text-slate-500 block mb-1">Assinatura do Contrato</span>
                <span className="font-medium text-slate-900 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {client.data_assinatura ? formatDate(client.data_assinatura) : 'Não informada'}
                </span>
              </div>
              <div className="text-center">
                <span className="text-xs text-slate-500 block mb-1">Vencimento Mensal</span>
                <span className="font-medium text-slate-900 flex items-center gap-1.5 justify-center">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {client.vencimento_mensal ? `Dia ${client.vencimento_mensal}` : '--'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block mb-1">Valor Total Mensal</span>
                <span className="text-lg font-bold text-emerald-700">
                  {formatCurrency(client.totalValue)}
                </span>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {plan && (
                <div className="flex justify-between items-center bg-indigo-50/50 border border-indigo-100 p-3 rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 font-bold text-xs">TMS</span>
                    </div>
                    <div>
                      <span className="font-medium text-indigo-900 block leading-tight">
                        Plano Base: {plan.name}
                      </span>
                      <span className="text-xs text-indigo-600/80">Limites e recursos padrão</span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-indigo-700">
                    {formatCurrency(plan.price)}/mês
                  </span>
                </div>
              )}

              {client.filiais && client.filiais > 0 ? (
                <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-3 rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-slate-500" />
                    </div>
                    <span className="font-medium text-sm text-slate-700">
                      Filiais Adicionais ({client.filiais}x)
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-slate-600">
                    {formatCurrency(client.filiais * 199.0)}/mês
                  </span>
                </div>
              ) : null}

              {(client.modules || []).length > 0 && (
                <div className="mt-2">
                  <span className="text-xs font-bold text-slate-400 uppercase mb-2 block">
                    Serviços e Módulos Detalhados
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(client.modules || []).map((mod, idx) => (
                      <div
                        key={`${mod.name}-${idx}`}
                        className="flex justify-between items-center bg-white border border-slate-200 p-2.5 rounded-md group/mod"
                      >
                        <div className="flex items-center gap-2 overflow-hidden mr-2">
                          <div
                            className={cn(
                              'w-1.5 h-1.5 rounded-full shrink-0',
                              (mod.name || '').includes('Filial')
                                ? 'bg-amber-400'
                                : 'bg-emerald-400',
                            )}
                          ></div>
                          <span
                            className="font-medium text-xs text-slate-700 truncate"
                            title={mod.name}
                          >
                            {mod.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-500 whitespace-nowrap shrink-0">
                            {mod.price > 0 ? formatCurrency(mod.price) : 'Incluso'}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-slate-400 hover:text-red-600 opacity-0 group-hover/mod:opacity-100 transition-opacity ml-1"
                            onClick={() => handleRemoveModule(mod)}
                            title="Remover Item"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!plan &&
                (!client.filiais || client.filiais === 0) &&
                (client.modules || []).length === 0 &&
                (!client.cobrancas || client.cobrancas.length === 0) && (
                  <div className="text-sm text-slate-500 text-center py-6 bg-slate-50 rounded-md border border-dashed border-slate-200">
                    Nenhum plano ou módulo selecionado para este cliente.
                  </div>
                )}

              {Array.isArray(client.cobrancas) && client.cobrancas.length > 0 && (
                <div className="mt-4">
                  <span className="text-xs font-bold text-slate-400 uppercase mb-2 block">
                    Mensalidades / Cobranças Programadas
                  </span>
                  <div className="space-y-2">
                    {client.cobrancas.map((cob, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center bg-white border border-slate-200 p-2.5 rounded-md shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                          <span className="font-medium text-xs text-slate-700">
                            Vencimento:{' '}
                            {(cob.data_vencimento || '').includes('-')
                              ? formatDate(cob.data_vencimento)
                              : cob.data_vencimento}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-700">
                          {formatCurrency(cob.valor)}
                        </span>
                      </div>
                    ))}
                    {client.cobrancas.length > 1 && (
                      <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 p-2.5 rounded-md mt-2">
                        <span className="font-bold text-xs text-emerald-800">Total Somado</span>
                        <span className="text-sm font-bold text-emerald-700">
                          {formatCurrency(
                            client.cobrancas.reduce((acc, c) => acc + (c.valor || 0), 0),
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Clientes e Contratos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie carteira ativa, histórico de planos, upsell de módulos e contratos.
          </p>
        </div>

        <div className="flex gap-3">
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImportExcel}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            {isImporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Importar Base
          </Button>

          <Button onClick={handleOpenAdd} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Adicionar Módulo Dialog */}
      <Dialog open={isAddModuleOpen} onOpenChange={setIsAddModuleOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Módulos (Upsell)</DialogTitle>
            <DialogDescription>
              Selecione os novos módulos que o cliente contratou. Um Aditivo será gerado no
              histórico do cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Data da Solicitação / Adesão</Label>
              <Input
                type="date"
                value={aditivoDate}
                onChange={(e) => setAditivoDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Módulos Disponíveis</Label>
              {availableModulesForAddendum.length === 0 ? (
                <div className="text-sm text-slate-500 bg-slate-50 p-3 rounded border">
                  O cliente já possui todos os módulos disponíveis.
                </div>
              ) : (
                <ScrollArea className="h-64 border rounded-md p-3">
                  <div className="space-y-3">
                    {availableModulesForAddendum.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center space-x-3 bg-white p-2 hover:bg-slate-50 rounded"
                      >
                        <Checkbox
                          id={`new-mod-${m.id}`}
                          checked={selectedNewModules.includes(m.id)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedNewModules((prev) => [...prev, m.id])
                            else setSelectedNewModules((prev) => prev.filter((id) => id !== m.id))
                          }}
                        />
                        <Label
                          htmlFor={`new-mod-${m.id}`}
                          className="flex-1 cursor-pointer font-normal text-sm flex justify-between"
                        >
                          <span>{m.name}</span>
                          <span className="text-slate-500">
                            {m.price > 0 ? formatCurrency(m.price) : 'Incluso'}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {selectedNewModules.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-md">
                <div className="text-sm text-emerald-800 flex justify-between font-medium">
                  <span>Valor Adicional (Mensal):</span>
                  <span>
                    {formatCurrency(
                      selectedNewModules
                        .map((id) => MODULES.find((m) => m.id === id)?.price || 0)
                        .reduce((a, b) => a + b, 0),
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModuleOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveAditivo}
              disabled={selectedNewModules.length === 0 || isSubmittingAditivo}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSubmittingAditivo ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar Aditivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adicionar Filial Dialog */}
      <Dialog open={isAddFilialOpen} onOpenChange={setIsAddFilialOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Filial</DialogTitle>
            <DialogDescription>
              Cadastre uma nova filial para este cliente e configure a cobrança, incluindo DF-e se
              necessário. Um Aditivo será gerado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>CNPJ da Filial</Label>
              <Input
                placeholder="00.000.000/0000-00"
                value={filialForm.cnpj}
                onChange={(e) => {
                  const formatted = formatCNPJ(e.target.value)
                  setFilialForm((prev) => ({ ...prev, cnpj: formatted }))

                  const clean = formatted.replace(/\D/g, '')
                  if (clean.length === 14 && !filialForm.nome) {
                    fetchCnpjData(clean)
                      .then(({ data: cnpjData, notFound }) => {
                        if (cnpjData?.nome) {
                          setFilialForm((prev) => ({ ...prev, nome: cnpjData.nome }))
                          toast.success('Razão Social preenchida via Receita Federal.')
                        } else if (notFound) {
                          toast.warning(
                            'CNPJ não encontrado. Por favor, verifique os dados ou preencha manualmente.',
                          )
                        }
                      })
                      .catch(() => {})
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Razão Social / Nome da Filial</Label>
              <Input
                placeholder="Nome da Filial"
                value={filialForm.nome}
                onChange={(e) => setFilialForm((prev) => ({ ...prev, nome: e.target.value }))}
              />
            </div>

            <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-md border border-slate-200">
              <Checkbox
                id="dfe-incluso"
                checked={filialForm.dfe_incluso}
                onCheckedChange={(c) => {
                  setFilialForm((prev) => ({
                    ...prev,
                    dfe_incluso: !!c,
                  }))
                }}
              />
              <div className="flex-1">
                <Label htmlFor="dfe-incluso" className="font-medium cursor-pointer">
                  Incluir DF-e para esta Filial?
                </Label>
                <p className="text-xs text-slate-500">
                  Habilita o módulo de DF-e para esta unidade.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mensalidade (Filial) - R$</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={filialForm.valor_mensalidade}
                  onChange={(e) =>
                    setFilialForm((prev) => ({
                      ...prev,
                      valor_mensalidade: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>

              {filialForm.dfe_incluso && (
                <div className="space-y-2">
                  <Label>Valor do DF-e (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={filialForm.valor_dfe}
                    onChange={(e) =>
                      setFilialForm((prev) => ({
                        ...prev,
                        valor_dfe: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddFilialOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveFilial}
              disabled={!filialForm.cnpj || !filialForm.nome || isSubmittingAditivo}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSubmittingAditivo ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar e Gerar Aditivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adicionar/Editar Solicitação (Treinamento/Visita) Dialog */}
      <Dialog
        open={isAddSolicitacaoOpen}
        onOpenChange={(open) => {
          setIsAddSolicitacaoOpen(open)
          if (!open) resetSolicitacaoForm()
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSolicitacaoId
                ? 'Editar Solicitação de Serviço'
                : 'Nova Solicitação de Serviço'}
            </DialogTitle>
            <DialogDescription>
              {editingSolicitacaoId
                ? 'Atualize os detalhes da solicitação de serviço.'
                : 'Registre um treinamento ou visita técnica e defina os detalhes de cobrança.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Serviço</Label>
                <Select value={solicitacaoTipo} onValueChange={setSolicitacaoTipo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Treinamento">Treinamento</SelectItem>
                    <SelectItem value="Visita Técnica">Visita Técnica</SelectItem>
                    <SelectItem value="Upsell">Upsell</SelectItem>
                    <SelectItem value="Alteração Cadastral">Alteração Cadastral</SelectItem>
                    <SelectItem value="Inclusão de Módulo">Inclusão de Módulo</SelectItem>
                    <SelectItem value="Reclamação">Reclamação</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data da Solicitação</Label>
                <Input
                  type="date"
                  value={solicitacaoData}
                  onChange={(e) => setSolicitacaoData(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Contato</Label>
                <Input
                  placeholder="Nome do responsável"
                  value={solicitacaoContatoNome}
                  onChange={(e) => setSolicitacaoContatoNome(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone do Contato</Label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={solicitacaoContatoTelefone}
                  onChange={(e) => setSolicitacaoContatoTelefone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição do Serviço / Módulos</Label>
              <Textarea
                placeholder="Ex: Treinamento do módulo financeiro..."
                value={solicitacaoDescricao}
                onChange={(e) => setSolicitacaoDescricao(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-md border border-slate-100">
              <div className="space-y-2">
                <Label>Valor Acordado (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={solicitacaoValor}
                  onChange={(e) =>
                    setSolicitacaoValor(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <Select
                  value={solicitacaoFormaPagamento}
                  onValueChange={setSolicitacaoFormaPagamento}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Cartão">Cartão</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Data de Vencimento</Label>
                <Input
                  type="date"
                  value={solicitacaoDataVencimento}
                  onChange={(e) => setSolicitacaoDataVencimento(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Anexo (Opcional)</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="file"
                  onChange={(e) =>
                    setSolicitacaoDocumentoFile(e.target.files ? e.target.files[0] : null)
                  }
                  className="flex-1"
                />
                {solicitacaoDocumentoUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={solicitacaoDocumentoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" /> Ver Atual
                    </a>
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Informações adicionais..."
                value={solicitacaoObservacoes}
                onChange={(e) => setSolicitacaoObservacoes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSolicitacaoOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveSolicitacao}
              disabled={!solicitacaoDescricao || isSubmittingSolicitacao}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSubmittingSolicitacao ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingSolicitacaoId ? 'Atualizar Solicitação' : 'Salvar Solicitação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visualizar Aditivo Dialog */}
      {/* Gerar Proposta de Treinamento Dialog */}
      <Dialog open={isSetupTrainingProposalOpen} onOpenChange={setIsSetupTrainingProposalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Proposta de Treinamento</DialogTitle>
            <DialogDescription>
              Selecione os módulos para o treinamento e defina o valor do investimento para gerar o
              documento da proposta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Módulos do Treinamento</Label>
              <ScrollArea className="h-48 border rounded-md p-3 bg-slate-50">
                <div className="space-y-3">
                  {Object.keys(TRAINING_FEATURES).map((mod) => (
                    <div
                      key={mod}
                      className="flex items-center space-x-3 bg-white p-2 border rounded-md hover:bg-slate-50 transition-colors"
                    >
                      <Checkbox
                        id={`train-mod-${mod}`}
                        checked={selectedTrainingModules.includes(mod)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTrainingModules((prev) => {
                              const newModules = [...prev, mod]
                              setTrainingPrice(newModules.length * 250)
                              return newModules
                            })
                          } else {
                            setSelectedTrainingModules((prev) => {
                              const newModules = prev.filter((id) => id !== mod)
                              setTrainingPrice(newModules.length * 250)
                              return newModules
                            })
                          }
                        }}
                      />
                      <Label
                        htmlFor={`train-mod-${mod}`}
                        className="flex-1 cursor-pointer font-medium text-sm"
                      >
                        {mod}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="space-y-2">
              <Label>Valor da Proposta (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={trainingPrice}
                onChange={(e) => setTrainingPrice(parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-slate-500">
                Calculado automaticamente: R$ 250,00 por módulo. Pode ser ajustado manualmente.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-md border border-slate-200 mt-4 space-y-3">
              <Label className="text-slate-700 font-semibold block mb-1">
                Ações Automáticas (Após gerar)
              </Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="flag-impl"
                  checked={flagNotifyImplantacao}
                  onCheckedChange={(c) => setFlagNotifyImplantacao(!!c)}
                />
                <Label
                  htmlFor="flag-impl"
                  className="cursor-pointer font-normal text-sm text-slate-700"
                >
                  Criar solicitação para Implantação
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="flag-fin"
                  checked={flagNotifyFinanceiro}
                  onCheckedChange={(c) => setFlagNotifyFinanceiro(!!c)}
                />
                <Label
                  htmlFor="flag-fin"
                  className="cursor-pointer font-normal text-sm text-slate-700"
                >
                  Criar solicitação para Financeiro
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setIsSetupTrainingProposalOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={selectedTrainingModules.length === 0}
              onClick={handleGenerateTrainingProposal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Gerar Proposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Gerar Upsell */}
      <Dialog open={isUpsellModalOpen} onOpenChange={setIsUpsellModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gerar Proposta de Upsell</DialogTitle>
            <DialogDescription>
              Selecione os módulos adicionais e defina os valores. Isso criará uma proposta
              pendente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Data da Proposta</Label>
              <Input
                type="date"
                value={upsellDate}
                onChange={(e) => setUpsellDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Módulos Adicionais</Label>
              <ScrollArea className="h-48 border rounded-md p-3 bg-slate-50">
                <div className="space-y-3">
                  {availableModulesForAddendum.length === 0 ? (
                    <div className="text-sm text-slate-500">
                      O cliente já possui todos os módulos.
                    </div>
                  ) : (
                    availableModulesForAddendum.map((m) => {
                      const isSelected = upsellModules.includes(m.id)
                      return (
                        <div
                          key={m.id}
                          className="flex items-center space-x-3 bg-white p-2 border rounded-md hover:bg-slate-50"
                        >
                          <Checkbox
                            id={`up-mod-${m.id}`}
                            checked={isSelected}
                            onCheckedChange={(c) => {
                              if (c) {
                                setUpsellModules((prev) => [...prev, m.id])
                              } else {
                                setUpsellModules((prev) => prev.filter((id) => id !== m.id))
                              }
                            }}
                          />
                          <Label
                            htmlFor={`up-mod-${m.id}`}
                            className="flex-1 cursor-pointer font-medium text-sm flex justify-between"
                          >
                            <span>{m.name}</span>
                            <span className="text-slate-500">
                              {m.price > 0 ? formatCurrency(m.price) : 'Incluso'}
                            </span>
                          </Label>
                        </div>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor Único / Implantação (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={upsellOneTimeValue}
                  onChange={(e) =>
                    setUpsellOneTimeValue(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Acréscimo Mensal (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={upsellRecurringValue}
                  onChange={(e) =>
                    setUpsellRecurringValue(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpsellModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveUpsell}
              disabled={isSubmittingUpsell || upsellModules.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSubmittingUpsell && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Criar Proposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visualizar Proposta de Treinamento Dialog */}
      <Dialog
        open={!!viewingTrainingProposal}
        onOpenChange={(open) => !open && setViewingTrainingProposal(null)}
      >
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-100">
          <div className="flex justify-between items-center p-4 bg-white border-b shrink-0 print:hidden">
            <h2 className="font-semibold text-lg text-slate-800">Visualização de Proposta</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setViewingTrainingProposal(null)}>
                Fechar
              </Button>
              <Button
                onClick={() => {
                  const subject = encodeURIComponent(`Proposta de Treinamento - Service Logic`)
                  const body = encodeURIComponent(
                    `Boa tarde, ${viewingTrainingProposal.contato || 'Cliente'}!\n\nConforme alinhado, segue em anexo a proposta referente ao treinamento do(s) Módulo(s) ${viewingTrainingProposal.modules.map((m: any) => m.name).join(', ')}.\n\nO treinamento será realizado de forma on-line, ao final, disponibilizaremos também a gravação do treinamento para consulta posterior da equipe.\n\nAssim que recebermos o aceite da proposta, nossa equipe de implantação entrará em contato para verificar a melhor data e horário para realização do treinamento e efetuar o agendamento.\n\nFico à disposição para quaisquer dúvidas.`,
                  )
                  window.open(
                    `mailto:${viewingTrainingProposal.email}?subject=${subject}&body=${body}`,
                    '_blank',
                  )
                }}
                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
              >
                <Mail className="h-4 w-4 mr-2" /> E-mail Cliente
              </Button>
              <Button
                variant="outline"
                className="text-blue-700 border-blue-200 hover:bg-blue-50"
                onClick={async () => {
                  if (!viewingClient) return
                  try {
                    const sol = await createSolicitacao({
                      cliente_id: viewingClient.id,
                      tipo: 'Treinamento',
                      descricao: `Solicitação de Agendamento/Implantação de Treinamento.\nMódulos: ${viewingTrainingProposal.modules.map((m: any) => m.name).join(', ')}`,
                      contato_nome: viewingTrainingProposal.contato || null,
                      status: 'Pendente',
                    })

                    let senderName = 'Equipe'
                    if (user?.id) {
                      const { data: colab } = await supabase
                        .from('colaboradores')
                        .select('nome')
                        .eq('user_id', user.id)
                        .maybeSingle()
                      if (colab) senderName = colab.nome
                    }

                    await supabase.functions.invoke('send-implementation-email', {
                      body: {
                        to: 'gesualdo@servicelogic.com.br',
                        clientName: viewingTrainingProposal.clientName,
                        contactName: viewingTrainingProposal.contato || viewingClient.rep_nome,
                        contactPhone: viewingClient.originalData?.telefone,
                        modules: viewingTrainingProposal.modules
                          .map((m: any) => `- ${m.name}`)
                          .join('\n'),
                        senderName: senderName,
                      },
                    })

                    await createHistorico({
                      cliente_id: viewingClient.id,
                      tipo: 'Notificação Enviada',
                      observacoes:
                        'Solicitação de agendamento de treinamento enviada à equipe de implantação.',
                    })

                    toast.success('Solicitação de implantação gerada e salva no histórico.')
                    loadSolicitacoes(viewingClient.id)
                  } catch (e) {
                    toast.error('Erro ao salvar a solicitação no sistema.')
                  }
                }}
              >
                <Mail className="h-4 w-4 mr-2" /> Solicitar Implantação
              </Button>
              <Button
                variant="outline"
                className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                onClick={async () => {
                  if (!viewingClient) return
                  try {
                    await createSolicitacao({
                      cliente_id: viewingClient.id,
                      tipo: 'Outro',
                      descricao: `Faturamento de Treinamento.\nMódulos: ${viewingTrainingProposal.modules.map((m: any) => m.name).join(', ')}`,
                      valor: viewingTrainingProposal.price,
                      status: 'Pendente',
                    })
                    await createHistorico({
                      cliente_id: viewingClient.id,
                      tipo: 'Notificação Enviada',
                      observacoes: 'Solicitação de cobrança enviada ao departamento financeiro.',
                    })

                    const subject = encodeURIComponent(
                      `Faturamento de Treinamento - ${viewingTrainingProposal.clientName}`,
                    )
                    const body = encodeURIComponent(
                      `Boa tarde, tudo bem?\n\nPeço por gentileza que seja realizada a cobrança referente ao serviço abaixo:\n\nCliente: ${viewingTrainingProposal.clientName}\nResponsável: ${viewingTrainingProposal.contato || 'Não informado'}\n\nServiço contratado: Treinamento dos módulos ${viewingTrainingProposal.modules.map((m: any) => m.name).join(', ')}\nValor: R$ ${viewingTrainingProposal.price.toFixed(2).replace('.', ',')}\n\nPeço por gentileza que sigam com o faturamento/cobrança junto ao cliente.\n\nObrigada.`,
                    )
                    window.open(
                      `mailto:financeiro@servicelogic.com.br?subject=${subject}&body=${body}`,
                      '_blank',
                    )

                    toast.success('Solicitação de cobrança gerada e salva no histórico.')
                    loadSolicitacoes(viewingClient.id)
                  } catch (e) {
                    toast.error('Erro ao salvar a solicitação de cobrança.')
                  }
                }}
              >
                <Mail className="h-4 w-4 mr-2" /> Solicitar Cobrança
              </Button>
              <Button
                onClick={() => {
                  const printContent = document.getElementById('training-proposal-print')
                  if (printContent) {
                    const originalContents = document.body.innerHTML
                    document.body.innerHTML = printContent.innerHTML
                    window.print()
                    document.body.innerHTML = originalContents
                    window.location.reload()
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Printer className="h-4 w-4 mr-2" /> Imprimir / PDF
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1 p-4 sm:p-8 overflow-auto">
            <div className="max-w-[800px] mx-auto shadow-xl">
              {viewingTrainingProposal && <TrainingProposalDocument {...viewingTrainingProposal} />}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingAddendum} onOpenChange={(open) => !open && setViewingAddendum(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-100">
          <div className="flex justify-between items-center p-4 bg-white border-b shrink-0 print:hidden">
            <h2 className="font-semibold text-lg text-slate-800">
              Visualização de Aditivo Contratual
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setViewingAddendum(null)}>
                Fechar
              </Button>
              <Button
                variant="outline"
                className="text-blue-700 border-blue-200 hover:bg-blue-50"
                onClick={async () => {
                  if (!viewingClient || !viewingAddendum) return
                  try {
                    await createSolicitacao({
                      cliente_id: viewingClient.id,
                      tipo: 'Treinamento',
                      descricao: `Solicitação de Implantação para Aditivo Contratual.\nMódulos: ${viewingAddendum.modules?.map((m: any) => (typeof m === 'string' ? m : m.name)).join(', ')}`,
                      status: 'Pendente',
                    })

                    let senderName = 'Equipe'
                    if (user?.id) {
                      const { data: colab } = await supabase
                        .from('colaboradores')
                        .select('nome')
                        .eq('user_id', user.id)
                        .maybeSingle()
                      if (colab) senderName = colab.nome
                    }

                    await supabase.functions.invoke('send-implementation-email', {
                      body: {
                        to: 'gesualdo@servicelogic.com.br',
                        clientName: viewingClient.name,
                        contactName: viewingClient.rep_nome,
                        contactPhone: viewingClient.originalData?.telefone,
                        modules: viewingAddendum.modules
                          ?.map((m: any) => `- ${typeof m === 'string' ? m : m.name}`)
                          .join('\n'),
                        senderName: senderName,
                      },
                    })

                    await createHistorico({
                      cliente_id: viewingClient.id,
                      tipo: 'Notificação Enviada',
                      observacoes: 'Solicitação de implantação de aditivo enviada à equipe.',
                    })
                    toast.success('Solicitação de implantação gerada e salva no histórico.')
                    loadSolicitacoes(viewingClient.id)
                  } catch (e) {
                    toast.error('Erro ao salvar a solicitação.')
                  }
                }}
              >
                <Mail className="h-4 w-4 mr-2" /> Solicitar Implantação
              </Button>
              <Button
                variant="outline"
                className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                onClick={async () => {
                  if (!viewingClient || !viewingAddendum) return
                  try {
                    await createSolicitacao({
                      cliente_id: viewingClient.id,
                      tipo: 'Outro',
                      descricao: `Faturamento de Aditivo Contratual.\nMódulos adicionados: ${viewingAddendum.modules?.map((m: any) => (typeof m === 'string' ? m : m.name)).join(', ')}`,
                      valor: viewingAddendum.valorAdicional,
                      status: 'Pendente',
                    })
                    await createHistorico({
                      cliente_id: viewingClient.id,
                      tipo: 'Notificação Enviada',
                      observacoes: 'Solicitação de faturamento de aditivo enviada ao financeiro.',
                    })
                    toast.success('Solicitação de cobrança gerada e salva no histórico.')
                    loadSolicitacoes(viewingClient.id)
                  } catch (e) {
                    toast.error('Erro ao salvar a solicitação.')
                  }
                }}
              >
                <Mail className="h-4 w-4 mr-2" /> Solicitar Cobrança
              </Button>
              <Button onClick={handlePrintAddendum} className="bg-indigo-600 hover:bg-indigo-700">
                <Printer className="h-4 w-4 mr-2" /> Imprimir / Salvar PDF
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1 p-4 sm:p-8 overflow-auto">
            <div className="max-w-[800px] mx-auto bg-white shadow-xl" id="addendum-print-area">
              {viewingAddendum && <AddendumDocument {...viewingAddendum} />}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Sheet
        open={isSheetOpen}
        onOpenChange={(open) => {
          setIsSheetOpen(open)
          if (!open) setEditingClient(null)
        }}
      >
        <SheetContent className="sm:max-w-2xl w-[90vw] flex flex-col h-full">
          <SheetHeader>
            <SheetTitle>{editingClient ? 'Editar Cliente' : 'Adicionar Novo Cliente'}</SheetTitle>
            <SheetDescription>
              {editingClient
                ? 'Atualize os dados básicos da empresa.'
                : 'Preencha os dados abaixo para cadastrar um novo cliente na base.'}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 -mx-6 px-6 mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider border-b pb-2">
                    Dados da Empresa
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Razão Social</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                              <Input
                                placeholder="Ex: Transporte Rápido LTDA"
                                className="pl-9"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cnpj"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>CNPJ</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Hash className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                              <Input
                                placeholder="00.000.000/0001-00"
                                className="pl-9"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e)
                                  handleCnpjChange(e.target.value)
                                }}
                              />
                              {isLoadingCnpj && (
                                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-slate-400" />
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail (Opcional)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                              <Input
                                type="email"
                                placeholder="contato@empresa.com"
                                className="pl-9"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone (Opcional)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                              <Input placeholder="(00) 0000-0000" className="pl-9" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endereco"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Endereço Completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Av. Paulista, 1000 - SP" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rep_nome"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Representante Legal</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome Completo do Representante" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rep_cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF do Rep.</FormLabel>
                          <FormControl>
                            <Input placeholder="000.000.000-00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rep_rg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RG do Rep.</FormLabel>
                          <FormControl>
                            <Input placeholder="00.000.000-0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="data_assinatura"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Data de Assinatura do Contrato</FormLabel>
                          <FormControl>
                            <AdvancedDatePicker
                              value={field.value || ''}
                              onChange={field.onChange}
                              placeholder="Selecione a data de assinatura"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="vencimento_mensal"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Dia de Vencimento (Mensal)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={31}
                              placeholder="Ex: 10"
                              value={field.value ?? ''}
                              onChange={(e) => {
                                const val = e.target.value
                                if (val === '') {
                                  field.onChange(undefined)
                                } else {
                                  const num = parseInt(val, 10)
                                  if (!isNaN(num) && num >= 1 && num <= 31) {
                                    field.onChange(num)
                                  }
                                }
                              }}
                            />
                          </FormControl>
                          <p className="text-xs text-slate-500">
                            Dia do mês para o vencimento recorrente (1 a 31).
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider border-b pb-2">
                    Composição do Contrato
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <FormField
                      control={form.control}
                      name="plano_base"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plano Base / Emissões</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Ex: TMS 30 ou selecione..."
                                value={field.value || ''}
                                onChange={field.onChange}
                                className="bg-white flex-1"
                              />
                              <Select
                                onValueChange={field.onChange}
                                value={
                                  PLANS.some((p) => p.name === field.value)
                                    ? field.value
                                    : undefined
                                }
                              >
                                <SelectTrigger className="w-12 bg-white flex justify-center px-0">
                                  <ChevronDown className="h-4 w-4 opacity-50" />
                                </SelectTrigger>
                                <SelectContent>
                                  {PLANS.map((plan) => (
                                    <SelectItem key={plan.id} value={plan.name}>
                                      {plan.name} - {formatCurrency(plan.price)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="filiais"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nº Filiais Adicionais</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              className="bg-white"
                              value={field.value}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <p className="text-xs text-slate-500">R$ 199,00 por filial</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="border-t pt-4 mt-4 pb-2">
                    <h3 className="font-semibold text-sm mb-4">Filiais Vinculadas (DF-e)</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <FormField
                        control={form.control}
                        name="cobrar_filiais"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-white">
                            <div className="space-y-0.5">
                              <FormLabel>Cobrar por Filiais</FormLabel>
                              <div className="text-[11px] text-muted-foreground">
                                Aplicar custos no total do contrato
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={(c) => {
                                  field.onChange(c)
                                  if (!c) {
                                    form.setValue('quantidade_filiais', 0)
                                    form.setValue('filiais_detalhes', [])
                                  }
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {form.watch('cobrar_filiais') && (
                        <FormField
                          control={form.control}
                          name="quantidade_filiais"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantidade de Filiais</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  {...field}
                                  value={filiaisFields.length}
                                  readOnly
                                  className="bg-slate-50 cursor-not-allowed"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {form.watch('cobrar_filiais') && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-sm font-bold">
                            CNPJs das Filiais Vinculadas
                          </FormLabel>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              appendFilial({ nome: '', cnpj: '' })
                              form.setValue('quantidade_filiais', filiaisFields.length + 1)
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar Filial
                          </Button>
                        </div>
                        {filiaisFields.map((field, index) => (
                          <div
                            key={field.id}
                            className="relative grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-md border mt-2"
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute -top-3 -right-3 h-6 w-6 rounded-full bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 z-10"
                              onClick={() => {
                                removeFilial(index)
                                form.setValue('quantidade_filiais', filiaisFields.length - 1)
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                            <FormField
                              control={form.control}
                              name={`filiais_detalhes.${index}.nome`}
                              render={({ field: nameField }) => (
                                <FormItem>
                                  <FormLabel>Nome da Filial {index + 1}</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Nome da Filial" {...nameField} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`filiais_detalhes.${index}.cnpj`}
                              render={({ field: cnpjField }) => (
                                <FormItem>
                                  <FormLabel>CNPJ da Filial {index + 1}</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="00.000.000/0000-00"
                                      {...cnpjField}
                                      onChange={(e) => {
                                        const raw = e.target.value.replace(/\D/g, '')
                                        const formatted =
                                          raw.length <= 14 ? formatCNPJ(raw) : e.target.value
                                        cnpjField.onChange(formatted)

                                        if (raw.length === 14) {
                                          fetchCnpjData(raw)
                                            .then(({ data: cnpjData }) => {
                                              if (
                                                cnpjData?.nome &&
                                                !form.getValues(`filiais_detalhes.${index}.nome`)
                                              ) {
                                                form.setValue(
                                                  `filiais_detalhes.${index}.nome`,
                                                  cnpjData.nome,
                                                )
                                              }
                                            })
                                            .catch(() => {})
                                        }
                                      }}
                                      maxLength={18}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="modulos"
                    render={() => {
                      const renderModule = (module: any) => {
                        const isSelected = form
                          .watch('modulos')
                          ?.some((m: any) =>
                            typeof m === 'string' ? m === module.name : m.name === module.name,
                          )
                        const selectedModule = form
                          .watch('modulos')
                          ?.find((m: any) =>
                            typeof m === 'string' ? m === module.name : m.name === module.name,
                          )
                        const currentPrice =
                          selectedModule && typeof selectedModule !== 'string'
                            ? selectedModule.price
                            : module.price

                        return (
                          <FormField
                            key={module.id}
                            control={form.control}
                            name="modulos"
                            render={({ field }) => {
                              return (
                                <div className="flex flex-col rounded-md border bg-white hover:bg-slate-50 transition-colors overflow-hidden">
                                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-3">
                                    <FormControl>
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => {
                                          const currentValues = field.value || []
                                          if (checked) {
                                            field.onChange([
                                              ...currentValues,
                                              { name: module.name, price: module.price },
                                            ])
                                          } else {
                                            field.onChange(
                                              currentValues.filter((m: any) =>
                                                typeof m === 'string'
                                                  ? m !== module.name
                                                  : m.name !== module.name,
                                              ),
                                            )
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <div className="flex-1 flex justify-between items-center">
                                      <FormLabel className="font-medium cursor-pointer w-full h-full text-sm leading-none">
                                        {module.name}
                                      </FormLabel>
                                      {!isSelected && (
                                        <span className="text-xs text-slate-500 whitespace-nowrap ml-2 font-mono">
                                          {module.price > 0
                                            ? formatCurrency(module.price)
                                            : 'Incluso'}
                                        </span>
                                      )}
                                    </div>
                                  </FormItem>

                                  {isSelected && (
                                    <div className="flex items-center gap-2 px-3 pb-3 pt-1 bg-slate-50/50 border-t border-slate-100">
                                      <span className="text-xs text-slate-500 font-medium">
                                        {module.isBasic
                                          ? 'Valor (Desconto se negativo):'
                                          : 'Valor Mensal:'}
                                      </span>
                                      <div className="relative flex-1">
                                        <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">
                                          R$
                                        </span>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          className="h-7 text-xs pl-7 bg-white border-slate-200"
                                          value={currentPrice}
                                          onChange={(e) => {
                                            const newPrice = parseFloat(e.target.value) || 0
                                            const currentValues = field.value || []
                                            const updated = currentValues.map((m: any) => {
                                              const mName = typeof m === 'string' ? m : m.name
                                              if (mName === module.name) {
                                                return { name: module.name, price: newPrice }
                                              }
                                              return m
                                            })
                                            field.onChange(updated)
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            }}
                          />
                        )
                      }

                      return (
                        <FormItem>
                          <FormLabel className="text-base text-slate-700 block mb-2">
                            Módulos do Plano Básico
                          </FormLabel>
                          <div className="space-y-2 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:space-y-0">
                            {MODULES.filter((m: any) => m.isBasic).map(renderModule)}
                          </div>

                          <FormLabel className="text-base text-slate-700 block mt-6 mb-2">
                            Módulos Adicionais
                          </FormLabel>
                          <div className="space-y-2 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:space-y-0">
                            {MODULES.filter((m: any) => !m.isBasic).map(renderModule)}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    <div className="space-y-2">
                      <FormLabel className="text-sm">Desconto na Mensalidade</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormField
                          control={form.control}
                          name="tipo_desconto"
                          render={({ field }) => (
                            <FormItem className="w-24">
                              <FormControl>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <SelectTrigger className="bg-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="valor">R$</SelectItem>
                                    <SelectItem value="percentual">%</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="desconto_mensalidade"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  className="bg-white"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 mt-6 space-y-3">
                    <FormField
                      control={form.control}
                      name="valor_total"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-emerald-900 font-semibold text-sm">
                            Valor Total do Contrato (R$)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              className="font-bold bg-white text-lg h-12 text-emerald-700 border-emerald-200"
                            />
                          </FormControl>
                          <p className="text-xs text-emerald-600/80 mt-1">
                            Calculado automaticamente. Você pode alterar manualmente se necessário.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="pt-6 flex justify-end gap-3">
                  <Button variant="outline" type="button" onClick={() => setIsSheetOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting
                      ? 'Salvando...'
                      : editingClient
                        ? 'Atualizar Cliente'
                        : 'Salvar Cliente'}
                  </Button>
                </div>
              </form>
            </Form>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Sheet open={isViewSheetOpen} onOpenChange={setIsViewSheetOpen}>
        <SheetContent className="sm:max-w-[700px] w-[95vw] flex flex-col bg-slate-50/50">
          <SheetHeader className="bg-white p-6 -mx-6 -mt-6 border-b border-slate-200 shadow-sm z-10 relative">
            <div className="flex flex-col gap-4 pr-8">
              <div>
                <SheetTitle className="text-2xl text-slate-800">{viewingClient?.name}</SheetTitle>
                <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {viewingClient?.cnpj ? formatCNPJ(viewingClient.cnpj) : ''}
                  </span>
                  {viewingClient?.originalData?.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {viewingClient.originalData.email}
                    </span>
                  )}
                </div>
              </div>
              {/* Unified Action Bar */}
              <div className="flex flex-wrap justify-center gap-3 pb-1 pt-1">
                <Button
                  variant="outline"
                  disabled={isSendingImplementation}
                  onClick={() => viewingClient && handleActionSendImplementation(viewingClient)}
                  className="flex-1 min-w-[150px] max-w-[240px] h-10 bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                >
                  {isSendingImplementation ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Rocket className="h-4 w-4 mr-2" />
                  )}
                  Enviar para Implantação
                </Button>
                <Button
                  variant="outline"
                  disabled={isSendingFinanceiro}
                  onClick={() => viewingClient && handleActionSendFinanceiro(viewingClient)}
                  className="flex-1 min-w-[150px] max-w-[240px] h-10 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                >
                  {isSendingFinanceiro ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <DollarSign className="h-4 w-4 mr-2" />
                  )}
                  Enviar para Financeiro
                </Button>
                <Button
                  disabled={isSendingContract}
                  onClick={() => viewingClient && handleSendContractEmail(viewingClient)}
                  className="flex-1 min-w-[150px] max-w-[240px] h-10 bg-violet-600 text-white hover:bg-violet-700"
                >
                  {isSendingContract ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Enviar para Cliente
                </Button>
              </div>
              {/* Secondary Actions */}
              <div className="flex flex-wrap items-center gap-2 pb-1">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-slate-600 hover:text-slate-800"
                >
                  <Link
                    to={`/contratos?prospect=${encodeURIComponent(viewingClient?.name || '')}&cnpj=${viewingClient?.cnpj?.replace(/\D/g, '')}`}
                  >
                    <FileText className="h-3.5 w-3.5 mr-1.5" /> Novo Contrato
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  <Link
                    to={`/contratos?tab=cotacao&quoteTargetType=cliente&clientId=${viewingClient?.id}&prospect=${encodeURIComponent(viewingClient?.name || '')}&contato=${encodeURIComponent(viewingClient?.rep_nome || '')}`}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Gerar Upsell
                  </Link>
                </Button>
                {viewingClient?.originalData?.status?.toLowerCase() !== 'inativo' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCancelClient(viewingClient)
                      setCancelDate(new Date().toISOString().split('T')[0])
                      setCancelMotivo('')
                      setIsCancelModalOpen(true)
                    }}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    <Ban className="h-3.5 w-3.5 mr-1.5" /> Cancelamento
                  </Button>
                )}
              </div>
            </div>
          </SheetHeader>

          {viewingClient && (
            <Tabs defaultValue="resumo" className="mt-6 w-full h-full flex flex-col">
              <TabsList className="grid w-full max-w-3xl grid-cols-3 bg-white border border-slate-200">
                <TabsTrigger value="resumo">Resumo & Gestão</TabsTrigger>
                <TabsTrigger value="atendimentos">Atendimentos</TabsTrigger>
                <TabsTrigger value="contrato">Contrato Inicial</TabsTrigger>
              </TabsList>

              <TabsContent value="resumo" className="mt-4 flex-1">
                <ScrollArea className="h-[calc(100vh-14rem)] pr-4">
                  <ClientDetailsPanel client={viewingClient} />
                </ScrollArea>
              </TabsContent>

              <TabsContent
                value="atendimentos"
                className="mt-4 flex-1 bg-white border rounded-md shadow-sm p-4"
              >
                <ClientAtendimentosTab
                  clienteId={viewingClient.id}
                  clientName={viewingClient.name}
                />
              </TabsContent>

              <TabsContent
                value="contrato"
                className="mt-4 flex-1 bg-white border rounded-md shadow-sm"
              >
                <ScrollArea className="h-[calc(100vh-14rem)]">
                  <div className="min-w-[600px] bg-white p-4">
                    <ClientContractUpload
                      clientId={viewingClient.id}
                      clientName={viewingClient.name}
                      currentUrl={viewingClient.contratoUrl || null}
                      onUrlChange={(url) => {
                        setViewingClient((prev) =>
                          prev
                            ? {
                                ...prev,
                                contratoUrl: url,
                                originalData: {
                                  ...prev.originalData!,
                                  contrato_url: url,
                                },
                              }
                            : null,
                        )
                        loadClientes()
                      }}
                    />
                    <ContractDocument
                      name={viewingClient.name}
                      cnpj={viewingClient.cnpj}
                      address={viewingClient.endereco || viewingClient.originalData?.email || ''}
                      repName={viewingClient.rep_nome || ''}
                      repCpf={viewingClient.rep_cpf || ''}
                      repRg={viewingClient.rep_rg || ''}
                      selectedPlan={
                        PLANS.find(
                          (p) =>
                            p.name === viewingClient.plano_base ||
                            p.id === viewingClient.plano_base,
                        )?.id || 'tms-50'
                      }
                      selectedModules={viewingClient.modules
                        .map((m) => MODULES.find((mod) => mod.name === m.name)?.id || '')
                        .filter(Boolean)}
                      planData={PLANS.find(
                        (p) =>
                          p.name === viewingClient.plano_base || p.id === viewingClient.plano_base,
                      )}
                      planPrice={
                        PLANS.find(
                          (p) =>
                            p.name === viewingClient.plano_base ||
                            p.id === viewingClient.plano_base,
                        )?.price || 0
                      }
                      modulesPrice={viewingClient.modules.reduce((acc, m) => acc + m.price, 0)}
                      dfeData={null}
                      dfePrice={0}
                      totalValue={viewingClient.totalValue}
                      implMode={
                        (viewingClient.modo_implantacao as 'remoto' | 'presencial') || 'remoto'
                      }
                      implRate={
                        viewingClient.modo_implantacao === 'presencial'
                          ? IMPLEMENTATION_RATES.presencial
                          : IMPLEMENTATION_RATES.remoto
                      }
                      totalImplHours={
                        BASE_IMPLEMENTATION_HOURS +
                        viewingClient.modules.reduce(
                          (acc, m) =>
                            acc + (MODULES.find((mod) => mod.name === m.name)?.implHours || 0),
                          0,
                        )
                      }
                      implValue={
                        viewingClient.valor_implantacao ??
                        BASE_IMPLEMENTATION_HOURS * IMPLEMENTATION_RATES.remoto
                      }
                    />{' '}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>

      <Dialog
        open={!!implementationEmailClient}
        onOpenChange={(open) => !open && setImplementationEmailClient(null)}
      >
        <DialogContent className="sm:max-w-2xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Enviar para Implantação</DialogTitle>
            <DialogDescription>
              Revise os dados abaixo e envie o e-mail de introdução para a equipe de implantação.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 py-4 flex flex-col min-h-0">
            <Textarea
              className="flex-1 resize-none h-full font-mono text-sm p-4 bg-slate-50 border-slate-200"
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImplementationEmailClient(null)}>
              Cancelar
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(emailBody)
                toast.success('E-mail copiado para a área de transferência!')
              }}
            >
              Copiar Texto
            </Button>
            <Button
              onClick={async () => {
                const subject = encodeURIComponent(
                  `Novo Cliente para Implantação - ${implementationEmailClient?.name}`,
                )
                const body = encodeURIComponent(emailBody)
                window.open(
                  `mailto:gesualdo@servicelogic.com.br?subject=${subject}&body=${body}`,
                  '_blank',
                )

                if (implementationEmailClient) {
                  try {
                    await updateCliente(implementationEmailClient.id, { status: 'Em Implantação' })
                    toast.success("Cliente atualizado para 'Em Implantação'")
                    loadClientes()
                  } catch (err) {
                    console.error(err)
                    toast.error('Erro ao atualizar status do cliente')
                  }
                }
                setImplementationEmailClient(null)
              }}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Mail className="h-4 w-4 mr-2" /> Enviar via E-mail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Informar Cancelamento de Contrato</DialogTitle>
            <DialogDescription>
              Registre os detalhes do cancelamento do contrato do cliente{' '}
              <strong className="text-slate-900">{cancelClient?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Data da Solicitação</Label>
              <AdvancedDatePicker
                value={cancelDate}
                onChange={setCancelDate}
                placeholder="Selecione a data do cancelamento"
              />
            </div>
            <div className="space-y-2">
              <Label>Motivo do Cancelamento</Label>
              <Textarea
                placeholder="Descreva o motivo do cancelamento do contrato..."
                value={cancelMotivo}
                onChange={(e) => setCancelMotivo(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmCancel}
              disabled={!cancelDate || !cancelMotivo.trim() || isSubmittingCancel}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmittingCancel && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!clientToDelete}
        onOpenChange={(open) => !open && setClientToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente{' '}
              <strong className="text-slate-900">{clientToDelete?.name}</strong>? Esta ação não
              poderá ser desfeita e todos os dados relacionados ao contrato serão removidos
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sim, Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="border-slate-200/60 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 mb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg">Carteira Ativa</CardTitle>
              <CardDescription>
                {mergedClients.length} empresas com contratos vigentes.
              </CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou CNPJ..."
                  className="pl-9 h-9 bg-slate-50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filtrar por Status</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={filterType}
                    onValueChange={(val: any) => setFilterType(val)}
                  >
                    <DropdownMenuRadioItem value="all" className="cursor-pointer">
                      Todos os clientes
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="with_contract" className="cursor-pointer">
                      Com contrato ativo
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="without_contract" className="cursor-pointer">
                      Sem contrato / Pendente
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Ordenar Alfabeticamente</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={sortOrder}
                    onValueChange={(val: any) => setSortOrder(val)}
                  >
                    <DropdownMenuRadioItem value="asc" className="cursor-pointer">
                      A - Z (Crescente)
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="desc" className="cursor-pointer">
                      Z - A (Decrescente)
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead>Empresa / CNPJ</TableHead>
                <TableHead>Módulos Contratados</TableHead>
                <TableHead>Mensalidade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Carregando clientes...
                  </TableCell>
                </TableRow>
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow
                    key={client.id}
                    className={cn(
                      'group transition-colors',
                      client.originalData?.status?.toLowerCase() === 'inativo'
                        ? 'opacity-60 hover:opacity-80'
                        : 'hover:bg-slate-50/80',
                    )}
                  >
                    <TableCell>
                      <div className="font-medium text-slate-900">{client.name}</div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                        <span className="text-xs text-slate-500 font-mono">
                          {formatCNPJ(client.cnpj)}
                        </span>
                        {client.filiais_detalhes && client.filiais_detalhes.length > 0 && (
                          <div className="flex flex-col gap-0.5 sm:ml-2 sm:pl-2 sm:border-l sm:border-slate-200">
                            {client.filiais_detalhes.map((f, idx) => (
                              <span key={idx} className="text-[10px] text-slate-400 font-mono">
                                ↳ {formatCNPJ(f.cnpj)}
                              </span>
                            ))}
                          </div>
                        )}
                        {client.originalData?.status === 'Em Implantação' && (
                          <Badge
                            variant="outline"
                            className="w-fit text-[10px] px-1.5 py-0 h-4 leading-none text-blue-600 bg-blue-50 border-blue-200"
                          >
                            Em Implantação
                          </Badge>
                        )}
                        {client.originalData?.status === 'Faturamento' && (
                          <Badge
                            variant="outline"
                            className="w-fit text-[10px] px-1.5 py-0 h-4 leading-none text-emerald-600 bg-emerald-50 border-emerald-200"
                          >
                            Faturamento
                          </Badge>
                        )}
                        {client.originalData?.status?.toLowerCase() === 'inativo' && (
                          <Badge
                            variant="outline"
                            className="w-fit text-[10px] px-1.5 py-0 h-4 leading-none text-red-600 bg-red-50 border-red-200"
                          >
                            Inativo
                          </Badge>
                        )}
                        {client.stats && client.stats.relevantTitulos > 0 && (
                          <Badge
                            variant="outline"
                            className={`w-fit text-[10px] px-1.5 py-0 h-4 leading-none ${client.stats.color}`}
                          >
                            {client.stats.classification}
                          </Badge>
                        )}
                      </div>
                      {client.tags && client.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {client.tags.slice(0, 3).map((tag, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-[9px] px-1.5 py-0 h-4 font-normal bg-purple-50 text-purple-700 border-purple-200"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {client.tags.length > 3 && (
                            <span className="text-[10px] text-slate-400">
                              +{client.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        {client.plano_base && (
                          <Badge
                            variant="outline"
                            className="w-fit bg-indigo-50 text-indigo-700 border-indigo-100 font-medium text-[10px] uppercase"
                          >
                            {client.plano_base}
                          </Badge>
                        )}
                        <div className="flex flex-wrap gap-1 max-w-[250px]">
                          {client.modules.length > 0
                            ? client.modules.map((mod) => (
                                <Badge
                                  key={mod.name}
                                  variant="secondary"
                                  className="bg-slate-100 text-slate-700 border-slate-200 font-normal text-xs"
                                >
                                  {mod.name}
                                </Badge>
                              ))
                            : !client.plano_base && (
                                <span className="text-xs text-slate-400 italic">Sem módulos</span>
                              )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.totalValue > 0 ? (
                        <span className="font-medium text-emerald-600">
                          {formatCurrency(client.totalValue)}
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium text-sm bg-amber-50 px-2 py-1 rounded border border-amber-100">
                          Pendente
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {client.originalData?.status?.toLowerCase() !== 'inativo' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-600 hover:text-red-600 hover:bg-red-50"
                            title="Informar Cancelamento"
                            onClick={() => {
                              setCancelClient(client)
                              setCancelDate(new Date().toISOString().split('T')[0])
                              setCancelMotivo('')
                              setIsCancelModalOpen(true)
                            }}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                        {client.contratoUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            title="Ver Contrato Original"
                            onClick={() => handleOpenContractUrl(client.contratoUrl)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          title="Visualizar Gestão/Aditivos"
                          onClick={() => handleOpenView(client)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                          title="Editar Cliente"
                          onClick={() => handleOpenEdit(client)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-600 hover:text-red-600 hover:bg-red-50"
                          title="Excluir Cliente"
                          onClick={() => setClientToDelete(client)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={isSignatureLinkOpen}
        onOpenChange={(open) => {
          setIsSignatureLinkOpen(open)
          if (!open) setAutoSendContractAfterLink(false)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link de Assinatura Eletrônica</DialogTitle>
            <DialogDescription>
              Defina o link para assinatura eletrônica do contrato do cliente{' '}
              <strong className="text-slate-900">{signatureLinkClient?.name}</strong>. Este link
              será incluído no e-mail enviado ao cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>URL do Link de Assinatura</Label>
              <Input
                placeholder="https://exemplo.com/assinatura/..."
                value={signatureLinkValue}
                onChange={(e) => setSignatureLinkValue(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                Cole aqui o link gerado pela plataforma de assinatura eletrônica (ex: DocuSign,
                Clicksign, etc).
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-violet-50 p-3 border border-violet-100">
              <Checkbox
                id="auto-send-contract"
                checked={autoSendContractAfterLink}
                onCheckedChange={(checked) => setAutoSendContractAfterLink(checked === true)}
              />
              <Label htmlFor="auto-send-contract" className="text-sm cursor-pointer flex-1">
                Enviar contrato por e-mail após salvar o link
              </Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsSignatureLinkOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveSignatureLink}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              Salvar e Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDocUploadOpen} onOpenChange={setIsDocUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Anexar Documento</DialogTitle>
            <DialogDescription>
              Selecione o arquivo e a categoria do documento para salvar no repositório do cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Categoria do Documento</Label>
              <Select value={docUploadCategory} onValueChange={setDocUploadCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cartão CNPJ">Cartão CNPJ</SelectItem>
                  <SelectItem value="Contrato Social">Contrato Social</SelectItem>
                  <SelectItem value="Certificado Digital">Certificado Digital</SelectItem>
                  <SelectItem value="Inscrição Estadual">Inscrição Estadual</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Arquivo</Label>
              <Input
                type="file"
                onChange={(e) => setDocUploadFile(e.target.files ? e.target.files[0] : null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDocUploadOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDocUpload}
              disabled={!docUploadFile || isUploadingDocs}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isUploadingDocs && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Anexar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
