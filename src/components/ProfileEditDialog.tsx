import { useState, useEffect, useRef } from 'react'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UserCog, Camera, Trash2, Loader2 } from 'lucide-react'
import { ColaboradorProfile } from '@/hooks/use-colaborador-profile'

interface ProfileEditDialogProps {
  profile: ColaboradorProfile | null
  onUpdate: (nome: string, cargo: string) => Promise<{ error: any }>
  onUploadAvatar: (file: File) => Promise<{ error: any }>
  onDeleteAvatar: () => Promise<{ error: any }>
  trigger: React.ReactNode
}

export function ProfileEditDialog({
  profile,
  onUpdate,
  onUploadAvatar,
  onDeleteAvatar,
  trigger,
}: ProfileEditDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [cargo, setCargo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    await onUploadAvatar(file)
    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeleteAvatar = async () => {
    setIsDeleting(true)
    await onDeleteAvatar()
    setIsDeleting(false)
  }

  const avatarUrl = profile?.avatar_url ?? null
  const fallback = profile?.nome
    ? profile.nome
        .split(' ')
        .slice(0, 2)
        .map((n) => (n[0] || '').toUpperCase())
        .join('')
    : '?'
  const avatarGender = profile?.image_gender === 'female' ? 'female' : 'male'
  const avatarSeed = profile?.id ? profile.id.slice(0, 8) : 'default'

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
        <div className="mt-4 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-muted shadow-md">
                <AvatarImage
                  src={
                    avatarUrl ||
                    `https://img.usecurling.com/ppl/medium?gender=${avatarGender}&seed=${avatarSeed}`
                  }
                  alt="Avatar"
                />
                <AvatarFallback className="text-2xl">{fallback}</AvatarFallback>
              </Avatar>
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isDeleting}
              >
                <Camera className="mr-2 h-4 w-4" />
                {avatarUrl ? 'Trocar Foto' : 'Enviar Foto'}
              </Button>
              {avatarUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteAvatar}
                  disabled={isUploading || isDeleting}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {isDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Remover
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <Button type="submit" className="w-full" disabled={isSubmitting || !nome.trim()}>
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
