import { useState, useEffect } from 'react'
import { Search, Filter, Eye, Plus, Building2, Mail, Phone, Hash } from 'lucide-react'
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
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import useAppStore, { Client } from '@/stores/main'
import { formatCurrency, formatCNPJ, formatDate } from '@/lib/formatters'
import { fetchClientes, createCliente, ClienteRecord } from '@/services/clientes'
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
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'

const clientSchema = z.object({
  nome: z.string().min(2, 'Razão Social é obrigatória'),
  cnpj: z.string().min(14, 'CNPJ inválido'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().optional().or(z.literal('')),
  modulos: z.array(z.string()),
  valor_total: z.number().min(0),
})

type ClientFormValues = z.infer<typeof clientSchema>

export default function ClientsPage() {
  const { clients: storeClients, modules } = useAppStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [clientes, setClientes] = useState<ClienteRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nome: '',
      cnpj: '',
      email: '',
      telefone: '',
      modulos: [],
      valor_total: 0,
    },
  })

  useEffect(() => {
    loadClientes()
  }, [])

  const loadClientes = async () => {
    setIsLoading(true)
    try {
      const data = await fetchClientes()
      setClientes(data)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar clientes do banco')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: ClientFormValues) => {
    try {
      await createCliente(data)
      toast.success('Cliente adicionado com sucesso!')
      setIsAddSheetOpen(false)
      form.reset()
      loadClientes()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao adicionar cliente')
    }
  }

  const mergedClients = [
    ...clientes.map((c) => ({
      id: c.id,
      name: c.nome,
      cnpj: c.cnpj,
      modules: c.modulos || [],
      totalValue: c.valor_total,
      createdAt: c.created_at,
    })),
  ]

  storeClients.forEach((sc) => {
    if (!mergedClients.some((mc) => mc.cnpj === sc.cnpj)) {
      mergedClients.push(sc)
    }
  })

  const filteredClients = mergedClients.filter(
    (c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.cnpj.includes(searchTerm),
  )

  const getModuleNames = (moduleIds: string[]) => {
    return moduleIds.map((id) => {
      const mod = modules.find((m) => m.id === id)
      return mod ? mod.name : id
    })
  }

  const ClientDetailsPanel = ({ client }: { client: Client }) => (
    <div className="mt-6 space-y-6">
      <div>
        <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">
          Dados da Empresa
        </h4>
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
            {client.modules.map((modId) => {
              const mod = modules.find((m) => m.id === modId)
              return mod ? (
                <div
                  key={mod.id}
                  className="flex justify-between items-center bg-white border border-slate-200 p-3 rounded-md shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${mod.color.split(' ')[0]}`}></div>
                    <span className="font-medium text-sm">{mod.name}</span>
                  </div>
                  <span className="text-sm text-slate-600">{formatCurrency(mod.price)}/mês</span>
                </div>
              ) : null
            })}
          </div>
          <div className="flex justify-between items-center bg-emerald-50 p-4 rounded-lg border border-emerald-100 mt-4">
            <span className="font-semibold text-emerald-900">Total da Mensalidade</span>
            <span className="text-xl font-bold text-emerald-700">
              {formatCurrency(client.totalValue)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Base de Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os contratos ativos e informações detalhadas.
          </p>
        </div>
        <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
          <SheetTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-lg w-[90vw] flex flex-col h-full">
            <SheetHeader>
              <SheetTitle>Adicionar Novo Cliente</SheetTitle>
              <SheetDescription>
                Preencha os dados abaixo para cadastrar um novo cliente na base.
              </SheetDescription>
            </SheetHeader>

            <ScrollArea className="flex-1 -mx-6 px-6 mt-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                      Dados da Empresa
                    </h4>

                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
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
                        <FormItem>
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

                    <div className="grid grid-cols-2 gap-4">
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

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                      Planos e Módulos
                    </h4>

                    <FormField
                      control={form.control}
                      name="modulos"
                      render={() => (
                        <FormItem>
                          <div className="space-y-2 mt-2">
                            {modules.map((module) => (
                              <FormField
                                key={module.id}
                                control={form.control}
                                name="modulos"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={module.id}
                                      className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 bg-white"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(module.id)}
                                          onCheckedChange={(checked) => {
                                            const currentValues = field.value || []
                                            const updated = checked
                                              ? [...currentValues, module.id]
                                              : currentValues.filter((value) => value !== module.id)

                                            field.onChange(updated)

                                            const total = updated.reduce((acc, modId) => {
                                              const m = modules.find((x) => x.id === modId)
                                              return acc + (m?.price || 0)
                                            }, 0)
                                            form.setValue('valor_total', total)
                                          }}
                                        />
                                      </FormControl>
                                      <div className="flex-1 flex justify-between items-center">
                                        <FormLabel className="font-medium cursor-pointer">
                                          {module.name}
                                        </FormLabel>
                                        <span className="text-sm text-slate-500">
                                          {formatCurrency(module.price)}/mês
                                        </span>
                                      </div>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex justify-between items-center mt-6">
                      <span className="font-semibold text-emerald-900">Mensalidade Estimada</span>
                      <span className="text-xl font-bold text-emerald-700">
                        {formatCurrency(form.watch('valor_total'))}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setIsAddSheetOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Cliente'}
                    </Button>
                  </div>
                </form>
              </Form>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

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
                <TableHead className="text-right">Detalhes</TableHead>
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
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {formatCNPJ(client.cnpj)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5 max-w-[250px]">
                        {getModuleNames(client.modules).map((name) => (
                          <Badge
                            key={name}
                            variant="secondary"
                            className="bg-slate-100 text-slate-700 border-slate-200 font-normal"
                          >
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-emerald-600">
                      {formatCurrency(client.totalValue)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          >
                            <Eye className="h-4 w-4 mr-1.5" />
                            Visualizar
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="sm:max-w-md w-[90vw]">
                          <SheetHeader>
                            <SheetTitle className="text-2xl">{client.name}</SheetTitle>
                            <SheetDescription>
                              Dossiê completo do cliente e faturamento.
                            </SheetDescription>
                          </SheetHeader>
                          <ClientDetailsPanel client={client} />
                        </SheetContent>
                      </Sheet>
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
