import { useState, type ReactNode } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Card } from '@/components/ui/card'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsibleSectionProps {
  id: string
  title: string
  icon?: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  badge?: ReactNode
}

export function CollapsibleSection({
  id,
  title,
  icon,
  children,
  defaultOpen = false,
  badge,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div id={id} className="scroll-mt-20">
      <Collapsible open={open} onOpenChange={setOpen}>
        <Card className="overflow-hidden">
          <CollapsibleTrigger
            className={cn(
              'w-full flex items-center justify-between p-4',
              'hover:bg-muted/50 transition-colors text-left',
            )}
          >
            <div className="flex items-center gap-2">
              {icon}
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{title}</h3>
              {badge}
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0',
                open && 'rotate-180',
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="data-[state=open]:animate-fade-in">
            <div className="p-4 pt-0">{children}</div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  )
}
