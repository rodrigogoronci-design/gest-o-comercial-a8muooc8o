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
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Separator } from '@/components/ui/separator'
import useAppStore from '@/stores/main'
import { formatCurrency, formatCNPJ, formatDate } from '@/lib/formatters'
import { fetchClientes, createCliente, updateCliente, deleteCliente } from '@/services/clientes'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
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
import { PLANS, MODULES } from '@/constants/contracts'

export interface ClienteRecord {
  id: string
  nome: string
  cnpj: string
  email?: string | null
  telefone?: string | null
  modulos?: any
  valor_total?: number | null
  status?: string | null
  created_at: string
  contrato_url?: string | null
}

type ModuleItem = { name: string; price: number }

type MergedClient = {
  id: string
  name: string
  cnpj: string
  modules: ModuleItem[]
  plano_base?: string
  filiais?: number
  totalValue: number
  createdAt: string
  isMock?: boolean
  originalData?: ClienteRecord
  contratoUrl?: string | null
  stats?: ReturnType<typeof calculateFinancialScore>
}

const clientSchema = z.object({
  nome: z.string().min(2, 'Razão Social é obrigatória'),
  cnpj: z.string().min(14, 'CNPJ inválido'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().optional().or(z.literal('')),
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
})

type ClientFormValues = z.infer<typeof clientSchema>

export default function ClientsPage() {
  const { clients: storeClients } = useAppStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [clientes, setClientes] = useState<ClienteRecord[]>([])
  const [receipts, setReceipts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<MergedClient | null>(null)

  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false)
  const [viewingClient, setViewingClient] = useState<MergedClient | null>(null)

  const [clientToDelete, setClientToDelete] = useState<MergedClient | null>(null)

  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    },
  })

  const watchPlanoBase = form.watch('plano_base')
  const watchFiliais = form.watch('filiais')
  const watchModulos = form.watch('modulos')

  useEffect(() => {
    if (!isSheetOpen) return
    const isDirty =
      form.formState.dirtyFields.plano_base ||
      form.formState.dirtyFields.filiais ||
      form.formState.dirtyFields.modulos

    if (isDirty) {
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

      form.setValue('valor_total', total, { shouldValidate: true })
    }
  }, [watchPlanoBase, watchFiliais, watchModulos, isSheetOpen, form])

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

  const handleOpenAdd = () => {
    setEditingClient(null)
    form.reset({
      nome: '',
      cnpj: '',
      email: '',
      telefone: '',
      modulos: [],
      plano_base: '',
      filiais: 0,
      valor_total: 0,
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
      modulos: client.modules || [],
      plano_base: client.plano_base || '',
      filiais: client.filiais || 0,
      valor_total: client.totalValue || 0,
    })
    setIsSheetOpen(true)
  }

  const handleOpenView = (client: MergedClient) => {
    setViewingClient(client)
    setIsViewSheetOpen(true)
  }

  const onSubmit = async (data: ClientFormValues) => {
    const payload = {
      nome: data.nome,
      cnpj: data.cnpj,
      email: data.email,
      telefone: data.telefone,
      valor_total: data.valor_total,
      modulos: {
        plano_base: data.plano_base,
        filiais: data.filiais,
        adicionais: data.modulos,
      },
    }

    try {
      if (editingClient) {
        if (editingClient.isMock) {
          await createCliente(payload)
          toast.success('Cliente adicionado à base com sucesso!')
        } else {
          await updateCliente(editingClient.id, payload)
          toast.success('Cliente atualizado com sucesso!')
        }
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

    if (clientToDelete.isMock) {
      toast.error('Não é possível excluir clientes de demonstração via sistema.')
      setClientToDelete(null)
      return
    }

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
          (h) => h.includes('valor') || h.includes('mensalidade') || h.includes('total'),
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

          if (idxValor !== -1 && row[idxValor]) {
            const rawValor = String(row[idxValor]).replace(/[R$\s]/gi, '')
            let parsedValor = 0
            if (rawValor.includes(',')) {
              parsedValor = parseFloat(rawValor.replace(/\./g, '').replace(',', '.'))
            } else {
              parsedValor = parseFloat(rawValor)
            }

            if (!isNaN(parsedValor) && parsedValor > 0) {
              existing.valor_total = parsedValor
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

        if (payload.valor_total === 0 && payload.modulos.length > 0) {
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

        const existing = existingClients.find(
          (c) =>
            (payload.cnpj !== '00000000000000' && c.cnpj.replace(/\D/g, '') === payload.cnpj) ||
            c.nome.toLowerCase() === payload.nome.toLowerCase(),
        )

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
        }

        if (existing) {
          updatedClients.push({
            id: existing.id,
            nome: payload.nome || existing.nome,
            cnpj: payload.cnpj !== '00000000000000' ? payload.cnpj : existing.cnpj,
            email: payload.email || existing.email,
            telefone: payload.telefone || existing.telefone,
            modulos: mergedMods,
            valor_total: payload.valor_total > 0 ? payload.valor_total : existing.valor_total,
          })
        } else {
          newClients.push({
            nome: payload.nome,
            cnpj: payload.cnpj,
            email: payload.email,
            telefone: payload.telefone,
            valor_total: payload.valor_total,
            modulos: mergedMods,
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
          (r.cnpj && r.cnpj.replace(/\D/g, '') === c.cnpj.replace(/\D/g, '')),
      )
      const stats = calculateFinancialScore(clientReceipts)

      let parsedModules: ModuleItem[] = []
      let plano_base = ''
      let filiais = 0

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

        if (!modDef) return null

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
      }

      return {
        id: c.id,
        name: c.nome,
        cnpj: c.cnpj,
        modules: parsedModules,
        plano_base,
        filiais,
        totalValue: c.valor_total || 0,
        createdAt: c.created_at,
        isMock: false,
        originalData: c,
        contratoUrl: c.contrato_url,
        stats,
      }
    }),
  ]

  storeClients.forEach((sc) => {
    if (!mergedClients.some((mc) => mc.cnpj === sc.cnpj)) {
      mergedClients.push({ ...sc, isMock: true, contratoUrl: null })
    }
  })

  const filteredClients = mergedClients.filter(
    (c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.cnpj.includes(searchTerm),
  )

  const ClientDetailsPanel = ({ client }: { client: MergedClient }) => {
    const plan = PLANS.find((p) => p.id === client.plano_base || p.name === client.plano_base)

    return (
      <div className="mt-6 space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Dados da Empresa
            </h4>
            {client.stats && client.stats.relevantTitulos > 0 && (
              <Badge variant="outline" className={`${client.stats.color}`}>
                {client.stats.classification} (Score: {client.stats.score})
              </Badge>
            )}
          </div>
          <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div>
              <span className="text-xs text-slate-500 block">Razão Social</span>
              <span className="font-medium">{client.name}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">CNPJ</span>
              <span className="font-medium text-slate-700">{formatCNPJ(client.cnpj)}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Cliente desde</span>
              <span className="font-medium text-slate-700">{formatDate(client.createdAt)}</span>
            </div>
          </div>
        </div>
        <Separator />
        <div>
          <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">
            Plano Contratado
          </h4>
          <div className="space-y-4">
            <div className="space-y-2">
              {plan && (
                <div className="flex justify-between items-center bg-indigo-50 border border-indigo-100 p-3 rounded-md shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    <span className="font-medium text-sm text-indigo-900">
                      Plano Base: {plan.name}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-indigo-700">
                    {formatCurrency(plan.price)}/mês
                  </span>
                </div>
              )}

              {client.filiais && client.filiais > 0 ? (
                <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-3 rounded-md shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                    <span className="font-medium text-sm text-slate-700">
                      Filiais Adicionais ({client.filiais}x)
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-slate-600">
                    {formatCurrency(client.filiais * 199.0)}/mês
                  </span>
                </div>
              ) : null}

              {client.modules.map((mod) => (
                <div
                  key={mod.name}
                  className="flex justify-between items-center bg-white border border-slate-200 p-3 rounded-md shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="font-medium text-sm">{mod.name}</span>
                  </div>
                  <span className="text-sm text-slate-600">
                    {mod.price > 0 ? formatCurrency(mod.price) + '/mês' : 'Incluso'}
                  </span>
                </div>
              ))}

              {!plan &&
                (!client.filiais || client.filiais === 0) &&
                client.modules.length === 0 && (
                  <div className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-md border border-dashed border-slate-200">
                    Nenhum módulo selecionado para este cliente.
                  </div>
                )}
            </div>
            <div className="flex justify-between items-center bg-emerald-50 p-4 rounded-lg border border-emerald-100 mt-4">
              <span className="font-semibold text-emerald-900">Total da Mensalidade</span>
              <span className="text-xl font-bold text-emerald-700">
                {formatCurrency(client.totalValue)}
              </span>
            </div>
          </div>
        </div>
        <Separator />
        <div>
          <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">
            Documentos
          </h4>
          {client.contratoUrl ? (
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-md shadow-sm">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-indigo-500" />
                <span className="font-medium text-sm text-slate-700">Contrato Original</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(client.contratoUrl!, '_blank')}
              >
                Abrir PDF
              </Button>
            </div>
          ) : (
            <div className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-md border border-dashed border-slate-200">
              Nenhum contrato anexado para este cliente.
            </div>
          )}

          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-md shadow-sm mt-3">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-amber-500" />
              <span className="font-medium text-sm text-slate-700">Proposta Aprovada</span>
            </div>
            <Button variant="outline" size="sm">
              Visualizar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Base de Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os contratos ativos, edite valores e informações detalhadas.
          </p>
        </div>

        <div className="flex gap-3">
          <input
            type="file"
            accept=".xlsx, .xls"
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
                ? 'Atualize os dados, módulos e valores do contrato deste cliente.'
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
                              <Input placeholder="00.000.000/0001-00" className="pl-9" {...field} />
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
                          <FormLabel>Plano Base</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Selecione um plano" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PLANS.map((plan) => (
                                <SelectItem key={plan.id} value={plan.name}>
                                  {plan.name} - {formatCurrency(plan.price)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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

                  <FormField
                    control={form.control}
                    name="modulos"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-base text-slate-700">
                          Módulos Adicionais
                        </FormLabel>
                        <div className="space-y-2 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:space-y-0">
                          {MODULES.map((module) => {
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
                                            Valor Mensal:
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
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                            Calculado automaticamente com base no Plano, Filiais e Módulos. Você
                            pode alterar manualmente se necessário.
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
        <SheetContent className="sm:max-w-md w-[90vw]">
          <SheetHeader>
            <SheetTitle className="text-2xl">{viewingClient?.name}</SheetTitle>
            <SheetDescription>Dossiê completo do cliente e faturamento.</SheetDescription>
          </SheetHeader>
          {viewingClient && <ClientDetailsPanel client={viewingClient} />}
        </SheetContent>
      </Sheet>

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
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Filter className="h-4 w-4" />
              </Button>
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
                    className="group hover:bg-slate-50/80 transition-colors"
                  >
                    <TableCell>
                      <div className="font-medium text-slate-900">{client.name}</div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                        <span className="text-xs text-slate-500 font-mono">
                          {formatCNPJ(client.cnpj)}
                        </span>
                        {client.stats && client.stats.relevantTitulos > 0 && (
                          <Badge
                            variant="outline"
                            className={`w-fit text-[10px] px-1.5 py-0 h-4 leading-none ${client.stats.color}`}
                          >
                            {client.stats.classification}
                          </Badge>
                        )}
                      </div>
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
                        {client.contratoUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            title="Ver Contrato"
                            onClick={() => window.open(client.contratoUrl!, '_blank')}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          title="Visualizar"
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
    </div>
  )
}
