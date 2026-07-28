import { cn } from '@/lib/utils'

interface StickyFormActionsProps {
  children: React.ReactNode
  className?: string
}

export function StickyFormActions({ children, className }: StickyFormActionsProps) {
  return (
    <div
      className={cn(
        'sticky top-0 z-30 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8',
        'py-3 mb-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80',
        'border-b border-border shadow-sm print:hidden',
        'flex items-center justify-end gap-2',
        className,
      )}
    >
      {children}
    </div>
  )
}
