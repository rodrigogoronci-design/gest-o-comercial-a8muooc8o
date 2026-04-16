import { useState } from 'react'
import { Search, Filter, Eye } from 'lucide-react'
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

export default function ClientsPage() {
  const { clients, modules } = useAppStore()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredClients = clients.filter(
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Base de Clientes</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie os contratos ativos e informações detalhadas.
        </p>
      </div>

      <Card className="border-slate-200/60 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 mb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg">Carteira Ativa</CardTitle>
              <CardDescription>{clients.length} empresas com contratos vigentes.</CardDescription>
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
              {filteredClients.length === 0 ? (
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
