import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserCog } from 'lucide-react'
import { ColaboradorProfile } from '@/hooks/use-colaborador-profile'

interface ProfileEditDialogProps {
  profile: ColaboradorProfile | null
  onUpdate: (nome: string, cargo: string) => Promise<{ error: any }>
  trigger: React.ReactNode
}

export function ProfileEditDialog({ profile, onUpdate, trigger }: ProfileEditDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [cargo, setCargo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && profile) {
      setNome(profile.nome || '')
      setCargo(profile.cargo || '')
    }
  }, [isOpen, profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return
    setIsSubmitting(true)
    const { error } = await onUpdate(nome, cargo)
    setIsSubmitting(false)
    if (!error) {
      setIsOpen(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-indigo-600" />
            Editar Perfil
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="profile-nome">Nome *</Label>
            <Input
              id="profile-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              placeholder="Seu nome completo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-cargo">Cargo</Label>
            <Input
              id="profile-cargo"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Seu cargo"
            />
          </div>
          <Button type="submit" className="w-full mt-4" disabled={isSubmitting || !nome.trim()}>
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
