import { useState } from 'react'
import { Bug, Trash2, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useBugScanner } from '@/hooks/use-bug-scanner'
import { cn } from '@/lib/utils'

export function BugScanner() {
  const { isActive, entries, toggle, clear } = useBugScanner()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={cn('relative', isActive && 'text-red-500 hover:text-red-600')}
        onClick={() => setOpen(true)}
        title="Bug Scanner"
      >
        <Bug className="h-5 w-5" />
        {isActive && entries.length > 0 && (
          <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {entries.length > 99 ? '99+' : entries.length}
          </span>
        )}
        {isActive && entries.length === 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" /> Bug Scanner
            </DialogTitle>
            <DialogDescription>
              Monitore erros de rede e console durante uploads e outras ações.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 mb-3">
            <Button
              size="sm"
              variant={isActive ? 'destructive' : 'default'}
              onClick={toggle}
              className="gap-1.5"
            >
              <Activity className="h-3.5 w-3.5" />
              {isActive ? 'Parar' : 'Iniciar'}
            </Button>
            {entries.length > 0 && (
              <>
                <Button size="sm" variant="outline" onClick={clear} className="gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" /> Limpar
                </Button>
                <Badge variant="secondary">{entries.length} erro(s)</Badge>
              </>
            )}
          </div>

          <ScrollArea className="h-[300px] rounded-md border p-3 bg-slate-50">
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Bug className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">
                  {isActive
                    ? 'Aguardando erros... Tente realizar um upload.'
                    : 'Inicie o monitoramento para capturar erros.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map((e) => (
                  <div
                    key={e.id}
                    className={cn(
                      'rounded-md p-2.5 text-xs border',
                      e.type === 'network'
                        ? 'bg-red-50 border-red-200 text-red-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900',
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold uppercase text-[10px]">
                        {e.type === 'network' ? 'Rede' : 'Console'}
                      </span>
                      <span className="text-[10px] opacity-60">
                        {new Date(e.timestamp).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                    <p className="break-all font-mono">{e.message}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
