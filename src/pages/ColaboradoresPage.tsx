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
import { UserPlus, Search, ShieldAlert, ShieldCheck, Pencil, Trash2, UserCheck } from 'lucide-react'

export default function ColaboradoresPage() {
  const [colaboradores, setColaboradores] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Colaborador',
    systemAccess: true,
  })
  const [editData, setEditData] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    role: 'Colaborador',
    systemAccess: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [isActivateOpen, setIsActivateOpen] = useState(false)
  const [activateData, setActivateData] = useState({
    id: '',
    name: '',
    email: '',
    password: 'Skip@Pass123',
    role: 'Colaborador',
  })

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
      let msg = error.message
      if (msg?.includes('User already registered') || msg?.includes('already exists')) {
        msg = 'Este e-mail já está cadastrado no sistema.'
      } else if (msg?.includes('Password should be at least')) {
        msg = 'A senha deve ter pelo menos 6 caracteres.'
      }
      toast.error('Erro ao adicionar colaborador', { description: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload: any = { ...editData }
      if (!payload.password) {
        delete payload.password
      }

      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: { action: 'update', payload },
      })

      if (error || data?.error) throw error || new Error(data?.error)

      toast.success('Colaborador atualizado com sucesso!')
      setIsEditOpen(false)
      fetchColaboradores()
    } catch (error: any) {
      toast.error('Erro ao atualizar colaborador', { description: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este colaborador?')) return

    try {
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: { action: 'delete', payload: { id } },
      })

      if (error || data?.error) throw error || new Error(data?.error)

      toast.success('Colaborador excluído com sucesso!')
      fetchColaboradores()
    } catch (error: any) {
      toast.error('Erro ao excluir colaborador', { description: error.message })
    }
  }

  const openEditDialog = (colab: any) => {
    setEditData({
      id: colab.id,
      name: colab.nome,
      email: colab.email || '',
      password: '',
      role: colab.role || 'Colaborador',
      systemAccess: !!colab.user_id,
    })
    setIsEditOpen(true)
  }

  const openActivateDialog = (colab: any) => {
    setActivateData({
      id: colab.id,
      name: colab.nome,
      email: colab.email || '',
      password: 'Skip@Pass123',
      role: colab.role || 'Colaborador',
    })
    setIsActivateOpen(true)
  }

  const handleActivateAccess = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!activateData.email.trim()) {
      toast.error('E-mail é obrigatório para ativar o acesso')
      return
    }

    setIsSubmitting(true)

    try {
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: {
          action: 'update',
          payload: {
            id: activateData.id,
            name: activateData.name,
            email: activateData.email,
            password: activateData.password,
            role: activateData.role,
            systemAccess: true,
          },
        },
      })

      if (error || data?.error) throw error || new Error(data?.error)

      toast.success('Acesso ativado com sucesso!')
      setIsActivateOpen(false)
      fetchColaboradores()
    } catch (error: any) {
      let msg = error.message
      if (msg?.includes('User already registered') || msg?.includes('already exists')) {
        msg = 'Este e-mail já está sendo utilizado por outro acesso.'
      } else if (msg?.includes('Password should be at least')) {
        msg = 'A senha deve ter pelo menos 6 caracteres.'
      }
      toast.error('Erro ao ativar acesso', { description: msg })
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

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Colaborador</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome Completo</Label>
                <Input
                  id="edit-name"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  required
                />
              </div>

              <div className="flex items-center justify-between border p-3 rounded-lg bg-muted/30">
                <div className="space-y-0.5">
                  <Label>Acesso ao Sistema</Label>
                  <p className="text-xs text-muted-foreground">Permitir login no sistema</p>
                </div>
                <Switch
                  checked={editData.systemAccess}
                  onCheckedChange={(c) => setEditData({ ...editData, systemAccess: c })}
                />
              </div>

              {editData.systemAccess && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">E-mail</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-password">Nova Senha (Opcional)</Label>
                    <Input
                      id="edit-password"
                      type="text"
                      value={editData.password}
                      onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                      placeholder="Deixe em branco para não alterar"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-role">Perfil de Acesso</Label>
                    <Select
                      value={editData.role}
                      onValueChange={(v) => setEditData({ ...editData, role: v })}
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
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isActivateOpen} onOpenChange={setIsActivateOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ativar Acesso ao Sistema</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleActivateAccess} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="activate-name">Nome</Label>
                <Input
                  id="activate-name"
                  value={activateData.name}
                  onChange={(e) => setActivateData({ ...activateData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activate-email">E-mail</Label>
                <Input
                  id="activate-email"
                  type="email"
                  value={activateData.email}
                  onChange={(e) => setActivateData({ ...activateData, email: e.target.value })}
                  placeholder="exemplo@servicelogic.com.br"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activate-password">Senha Provisória</Label>
                <Input
                  id="activate-password"
                  type="text"
                  value={activateData.password}
                  onChange={(e) => setActivateData({ ...activateData, password: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activate-role">Perfil de Acesso</Label>
                <Select
                  value={activateData.role}
                  onValueChange={(v) => setActivateData({ ...activateData, role: v })}
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
              <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                {isSubmitting ? 'Ativando...' : 'Ativar Acesso'}
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
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredColaboradores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!colab.user_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                          onClick={() => openActivateDialog(colab)}
                          title="Ativar acesso ao sistema"
                        >
                          <UserCheck className="h-4 w-4" />
                          Ativar Acesso
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(colab)}
                        title="Editar colaborador"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(colab.id)}
                        title="Excluir colaborador"
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
      </div>
    </div>
  )
}
