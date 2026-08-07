import React from 'react'
import { Link } from 'react-router-dom'
import { MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface TableActionItem {
  icon?: React.ComponentType<{ className?: string }>
  label: string
  onClick?: () => void
  to?: string
  variant?: 'default' | 'destructive'
  disabled?: boolean
}

export function TableActionsMenu({ items }: { items: TableActionItem[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {items.map((item, idx) => {
          const Icon = item.icon
          const content = (
            <>
              {Icon && <Icon className="mr-2 h-4 w-4" />}
              {item.label}
            </>
          )
          if (item.to) {
            return (
              <DropdownMenuItem
                key={idx}
                asChild
                disabled={item.disabled}
                className={cn(
                  'cursor-pointer',
                  item.variant === 'destructive' &&
                    'text-red-600 focus:text-red-600 focus:bg-red-50',
                )}
              >
                <Link to={item.to} className="flex items-center w-full">
                  {content}
                </Link>
              </DropdownMenuItem>
            )
          }
          return (
            <DropdownMenuItem
              key={idx}
              onClick={item.onClick}
              disabled={item.disabled}
              className={cn(
                'cursor-pointer',
                item.variant === 'destructive' && 'text-red-600 focus:text-red-600 focus:bg-red-50',
              )}
            >
              {content}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
