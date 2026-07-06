import { Bell, Search, UserCog, LogOut } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'
import { useColaboradorProfile } from '@/hooks/use-colaborador-profile'
import { ProfileEditDialog } from '@/components/ProfileEditDialog'
import { useNavigate } from 'react-router-dom'

export function AppHeader() {
  const { signOut } = useAuth()
  const { profile, updateProfile, uploadAvatar, deleteAvatar } = useColaboradorProfile()
  const navigate = useNavigate()

  const displayName = profile?.nome || 'Carregando...'
  const displayCargo = profile?.cargo || '—'
  const avatarUrl = profile?.avatar_url
  const fallback = profile?.nome
    ? profile.nome
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '?'
  const avatarGender = profile?.image_gender === 'female' ? 'female' : 'male'
  const avatarSeed = profile?.id ? profile.id.slice(0, 8) : 'default'

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background/95 backdrop-blur px-4 md:px-6 shadow-subtle">
      <SidebarTrigger className="-ml-1" />
      <div className="flex flex-1 items-center gap-4">
        <div className="w-full max-w-sm relative group">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-indigo-600" />
          <Input
            type="search"
            placeholder="Buscar cliente ou prospect..."
            className="w-full bg-muted/50 pl-9 border-transparent focus-visible:bg-background focus-visible:ring-indigo-600 focus-visible:border-indigo-600 transition-all rounded-full h-9"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground relative"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border border-background"></span>
        </Button>
        <div className="h-8 w-px bg-border mx-1"></div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity outline-none">
              <div className="hidden md:flex flex-col text-right leading-tight">
                <span className="text-sm font-medium">{displayName}</span>
                <span className="text-xs text-muted-foreground">{displayCargo}</span>
              </div>
              <Avatar className="h-9 w-9 border shadow-sm">
                <AvatarImage
                  src={
                    avatarUrl ||
                    `https://img.usecurling.com/ppl/thumbnail?gender=${avatarGender}&seed=${avatarSeed}`
                  }
                  alt="Avatar"
                />
                <AvatarFallback>{fallback}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">{displayCargo}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ProfileEditDialog
              profile={profile}
              onUpdate={updateProfile}
              onUploadAvatar={uploadAvatar}
              onDeleteAvatar={deleteAvatar}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                  <UserCog className="mr-2 h-4 w-4" />
                  <span>Editar Perfil</span>
                </DropdownMenuItem>
              }
            />
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
