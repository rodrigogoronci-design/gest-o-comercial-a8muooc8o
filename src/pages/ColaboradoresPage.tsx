import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { UserPlus, Search, ShieldAlert, ShieldCheck } from 'lucide-react'

export default function ColaboradoresPage() {
  const [colaboradores, setColaboradores] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Colaborador',
    systemAccess: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [search, setSearch] = useState('')

  const fetchColaboradores = async () => {
    setIsLoading(true)
    const { data, error } = await supabase.from('colaboradores').select('*').order('nome')

    if (error) {
      toast.error('Erro ao buscar colaboradores')
    } else {
      setColaboradores(data || [])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchColaboradores()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: { action: 'create', payload: formData },
      })

      if (error || data?.error) throw error || new Error(data?.error)

      toast.success('Colaborador adicionado com sucesso!')
      setIsOpen(false)
      setFormData({ name: '', email: '', password: '', role: 'Colaborador', systemAccess: true })
      fetchColaboradores()
    } catch (error: any) {
      toast.error('Erro ao adicionar colaborador', { description: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredColaboradores = colaboradores.filter(
    (c) =>
      c.nome?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Colaboradores</h1>
          <p className="text-muted-foreground">Gerencie o acesso e perfil da sua equipe</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Novo Colaborador
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Colaborador</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="flex items-center justify-between border p-3 rounded-lg bg-muted/30">
                <div className="space-y-0.5">
                  <Label>Acesso ao Sistema</Label>
                  <p className="text-xs text-muted-foreground">Permitir login no sistema</p>
                </div>
                <Switch
                  checked={formData.systemAccess}
                  onCheckedChange={(c) => setFormData({ ...formData, systemAccess: c })}
                />
              </div>

              {formData.systemAccess && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha Provisória</Label>
                    <Input
                      id="password"
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Ex: Skip@Pass123!"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Perfil de Acesso</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(v) => setFormData({ ...formData, role: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Administrador</SelectItem>
                        <SelectItem value="Gerente">Gerente</SelectItem>
                        <SelectItem value="Colaborador">Colaborador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar Colaborador'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar colaboradores..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Acesso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredColaboradores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhum colaborador encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredColaboradores.map((colab) => (
                <TableRow key={colab.id}>
                  <TableCell className="font-medium">{colab.nome}</TableCell>
                  <TableCell>{colab.email || '-'}</TableCell>
                  <TableCell>{colab.role}</TableCell>
                  <TableCell>
                    {colab.user_id ? (
                      <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium bg-green-500/10 w-fit px-2 py-1 rounded-md">
                        <ShieldCheck className="h-4 w-4" /> Ativo
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-muted-foreground text-sm bg-muted w-fit px-2 py-1 rounded-md">
                        <ShieldAlert className="h-4 w-4" /> Sem acesso
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
