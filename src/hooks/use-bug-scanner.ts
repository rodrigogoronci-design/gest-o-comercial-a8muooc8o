import { useState, useEffect, useCallback, useRef } from 'react'

export interface BugEntry {
  id: string
  type: 'console' | 'network'
  message: string
  timestamp: string
}

function safeStringify(val: unknown): string {
  if (typeof val === 'string') return val
  try {
    return JSON.stringify(val, null, 2)
  } catch {
    return String(val)
  }
}

function getUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  if ('url' in input) return (input as Request).url
  return String(input)
}

export function useBugScanner() {
  const [isActive, setIsActive] = useState(false)
  const [entries, setEntries] = useState<BugEntry[]>([])
  const origConsoleError = useRef(console.error)
  const origFetch = useRef(window.fetch)

  const addEntry = useCallback((type: BugEntry['type'], message: string) => {
    setEntries((prev) =>
      [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          type,
          message,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 100),
    )
  }, [])

  useEffect(() => {
    if (!isActive) return

    origConsoleError.current = console.error
    origFetch.current = window.fetch

    console.error = (...args: unknown[]) => {
      origConsoleError.current(...args)
      addEntry('console', args.map(safeStringify).join(' '))
    }

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        const res = await origFetch.current(input, init)
        if (!res.ok) {
          addEntry('network', `HTTP ${res.status} ${res.statusText} - ${getUrl(input)}`)
        }
        return res
      } catch (err) {
        addEntry(
          'network',
          `Fetch Error - ${getUrl(input)} - ${err instanceof Error ? err.message : String(err)}`,
        )
        throw err
      }
    }

    return () => {
      console.error = origConsoleError.current
      window.fetch = origFetch.current
    }
  }, [isActive, addEntry])

  const toggle = useCallback(() => setIsActive((p) => !p), [])
  const clear = useCallback(() => setEntries([]), [])

  return { isActive, entries, toggle, clear }
}
