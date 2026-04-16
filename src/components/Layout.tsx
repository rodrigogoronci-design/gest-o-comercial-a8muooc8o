import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'

export default function Layout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background font-sans text-foreground">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 min-w-0 bg-slate-50/50 dark:bg-background overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 w-full max-w-7xl mx-auto animate-fade-in-up">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
