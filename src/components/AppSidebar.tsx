import { Link, useLocation } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Tags,
  FileSignature,
  Rocket,
  ListTodo,
  CircleDollarSign,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'CRM / Prospecção', href: '/crm', icon: Users },
  { name: 'Base de Clientes', href: '/clientes', icon: Briefcase },
  { name: 'Diário de Atividades', href: '/atividades', icon: ListTodo },
  { name: 'Planos e Preços', href: '/planos', icon: Tags },
  { name: 'Gerador de Contratos', href: '/contratos', icon: FileSignature },
  { name: 'Acompanhamento de Recebimentos', href: '/recebimentos', icon: CircleDollarSign },
]

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar variant="sidebar" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-4 border-b border-sidebar-border/50">
        <div className="flex items-center gap-2 px-2 text-sidebar-primary">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <Rocket className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold text-base tracking-tight text-sidebar-foreground">
              Gestão Comercial
            </span>
            <span className="text-xs text-sidebar-foreground/70">CRM & Contratos</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider mb-2 mt-4">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                      <Link
                        to={item.href}
                        className="flex items-center gap-3 transition-all duration-200"
                      >
                        <item.icon className="size-4" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
