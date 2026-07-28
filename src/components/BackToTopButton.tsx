import { useState, useEffect, useCallback } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BackToTopButton() {
  const [visible, setVisible] = useState(false)

  const handleScroll = useCallback(() => {
    const scrollContainer = document.querySelector('[data-sidebar-inset]')
    const scrollTop = scrollContainer
      ? scrollContainer.scrollTop
      : window.scrollY || document.documentElement.scrollTop
    const viewportHeight = window.innerHeight
    setVisible(scrollTop > viewportHeight * 0.5)
  }, [])

  useEffect(() => {
    const scrollContainer = document.querySelector('[data-sidebar-inset]')
    const target = scrollContainer || window
    target.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => {
      target.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  const scrollToTop = () => {
    const scrollContainer = document.querySelector('[data-sidebar-inset]')
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <button
      onClick={scrollToTop}
      aria-label="Voltar ao topo"
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-center justify-center',
        'h-11 w-11 rounded-full shadow-lg',
        'bg-primary text-primary-foreground',
        'hover:bg-primary/90 active:scale-95',
        'transition-all duration-300',
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none',
        'print:hidden',
      )}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  )
}
