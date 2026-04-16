import { Bell, Search } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

export function AppHeader() {
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
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="hidden md:flex flex-col text-right leading-tight">
            <span className="text-sm font-medium">Alex Vendas</span>
            <span className="text-xs text-muted-foreground">Executivo de Contas</span>
          </div>
          <Avatar className="h-9 w-9 border shadow-sm">
            <AvatarImage
              src="https://img.usecurling.com/ppl/thumbnail?gender=male&seed=1"
              alt="Avatar"
            />
            <AvatarFallback>AV</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
