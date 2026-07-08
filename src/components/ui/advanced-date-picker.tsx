import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface AdvancedDatePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

function isoToBr(iso: string): string {
  if (!iso) return ''
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso
}

function brToIso(br: string): string | null {
  const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  const d = parseInt(m[1], 10)
  const mo = parseInt(m[2], 10)
  const y = parseInt(m[3], 10)
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1900) return null
  const date = new Date(y, mo - 1, d)
  if (date.getDate() !== d || date.getMonth() !== mo - 1) return null
  return `${m[3]}-${m[2]}-${m[1]}`
}

function maskDate(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 8)
  let r = digits.slice(0, 2)
  if (digits.length > 2) r += '/' + digits.slice(2, 4)
  if (digits.length > 4) r += '/' + digits.slice(4, 8)
  return r
}

function isoToDate(iso: string): Date | undefined {
  if (!iso) return undefined
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3])) : undefined
}

export function AdvancedDatePicker({
  value,
  onChange,
  placeholder,
  className,
}: AdvancedDatePickerProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    setInputValue(isoToBr(value))
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskDate(e.target.value)
    setInputValue(masked)
    if (masked.length === 10) {
      const iso = brToIso(masked)
      if (iso) onChange(iso)
    } else if (masked.length === 0) {
      onChange('')
    }
  }

  const handleInputBlur = () => {
    if (inputValue && inputValue.length !== 10) {
      setInputValue(isoToBr(value))
    } else if (inputValue.length === 10) {
      const iso = brToIso(inputValue)
      if (!iso) setInputValue(isoToBr(value))
    }
  }

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      onChange(iso)
      setInputValue(isoToBr(iso))
    } else {
      onChange('')
      setInputValue('')
    }
    setOpen(false)
  }

  return (
    <div className={cn('relative', className)}>
      <Input
        type="text"
        inputMode="numeric"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder={placeholder || 'DD/MM/AAAA'}
        maxLength={10}
        autoComplete="off"
        className="pr-10"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <CalendarIcon className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={isoToDate(value)}
            onSelect={handleSelect}
            captionLayout="dropdown"
            startMonth={new Date(2000, 0)}
            endMonth={new Date(new Date().getFullYear() + 5, 11)}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
