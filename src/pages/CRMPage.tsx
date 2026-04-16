import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, FileSignature, MoreHorizontal } from 'lucide-react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useAppStore, { ProspectStatus } from '@/stores/main'
import { formatDate } from '@/lib/formatters'

export default function CRMPage() {
  const { prospects, updateProspectStatus } = useAppStore()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredProspects = prospects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Contato Inicial':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200'
      case 'Em Negociação':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200'
      case 'Aguardando Feedback':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200'
      case 'Fechado':
        return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CRM e Prospecção</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie seus contatos e acompanhe o funil de vendas.
        </p>
      </div>

      <Card className="border-slate-200/60 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 mb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg">Pipeline de Vendas</CardTitle>
              <CardDescription>
                Lista atualizada de todas as negociações em andamento.
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar prospect..."
                className="pl-9 h-9 w-full bg-slate-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-[300px]">Empresa</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Última Interação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProspects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Nenhum prospect encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProspects.map((prospect) => (
                  <TableRow
                    key={prospect.id}
                    className="group hover:bg-slate-50/80 transition-colors"
                  >
                    <TableCell className="font-medium text-slate-900">{prospect.name}</TableCell>
                    <TableCell>{prospect.contactPerson}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(prospect.lastContact)}
                    </TableCell>
                    <TableCell>
                      <Select
                        defaultValue={prospect.status}
                        onValueChange={(val) =>
                          updateProspectStatus(prospect.id, val as ProspectStatus)
                        }
                      >
                        <SelectTrigger
                          className={`h-8 w-[160px] border rounded-full text-xs font-semibold px-3 ${getStatusColor(prospect.status)}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Contato Inicial">Contato Inicial</SelectItem>
                          <SelectItem value="Em Negociação">Em Negociação</SelectItem>
                          <SelectItem value="Aguardando Feedback">Aguardando Feedback</SelectItem>
                          <SelectItem value="Fechado">Fechado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          asChild
                        >
                          <Link to={`/contratos?prospect=${prospect.name}`}>
                            <FileSignature className="h-4 w-4" />
                            <span className="hidden sm:inline">Gerar Contrato</span>
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                          <MoreHorizontal className="h-4 w-4" />
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
