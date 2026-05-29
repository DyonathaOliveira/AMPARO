import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  Pill,
  CheckSquare,
  Calendar,
  ClipboardList,
  Bell,
  BarChart3,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import amparoLogo from "@assets/Captura_de_tela_2026-05-29_152616_1780079186016.png";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Residentes", href: "/residents" },
  { icon: Pill, label: "Medicações", href: "/medications" },
  { icon: CheckSquare, label: "Atividades", href: "/activities" },
  { icon: Calendar, label: "Agendamentos", href: "/appointments" },
  { icon: ClipboardList, label: "Passagem de Plantão", href: "/handover" },
  { icon: Bell, label: "Alertas", href: "/alerts" },
  { icon: BarChart3, label: "Relatórios", href: "/reports" },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { toggleSidebar, state } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border h-16 flex items-center px-4">
        <img
          src={amparoLogo}
          alt="AMPARO Logo"
          className={`h-8 w-auto transition-all ${state === "collapsed" ? "hidden" : "block"}`}
        />
        {state === "collapsed" && (
          <span className="font-bold text-xl text-primary">A</span>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={location.startsWith(item.href)} tooltip={item.label}>
                <Link href={item.href} className="flex items-center gap-3">
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        {user && (
          <div className={`flex flex-col gap-1 mb-4 ${state === "collapsed" ? "hidden" : "block"}`}>
            <span className="font-medium text-sm">{user.name}</span>
            <span className="text-xs text-muted-foreground capitalize">
              {user.role} • Turno: {user.shift}
            </span>
          </div>
        )}
        <SidebarMenuButton
          onClick={() => logout()}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair do sistema</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
