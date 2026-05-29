import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
  UserCog,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import amparoLogo from "@assets/Captura_de_tela_2026-05-29_152616_1780079186016.png";

const roleLabels: Record<string, string> = {
  nurse: "Enfermeiro(a)",
  caregiver: "Cuidador(a)",
  manager: "Gestor(a)",
};

const shiftLabels: Record<string, string> = {
  morning: "Manhã",
  afternoon: "Tarde",
  night: "Noite",
};

const baseMenuItems = [
  { icon: LayoutDashboard, label: "Painel", href: "/dashboard" },
  { icon: Users, label: "Residentes", href: "/residents" },
  { icon: Pill, label: "Medicações", href: "/medications" },
  { icon: CheckSquare, label: "Atividades", href: "/activities" },
  { icon: Calendar, label: "Agendamentos", href: "/appointments" },
  { icon: ClipboardList, label: "Passagem de Plantão", href: "/handover" },
  { icon: Bell, label: "Alertas", href: "/alerts" },
  { icon: BarChart3, label: "Relatórios", href: "/reports" },
];

const managerMenuItems = [
  { icon: LayoutDashboard, label: "Painel", href: "/dashboard" },
  { icon: Users, label: "Residentes", href: "/residents" },
  { icon: Pill, label: "Medicações", href: "/medications" },
  { icon: CheckSquare, label: "Atividades", href: "/activities" },
  { icon: Calendar, label: "Agendamentos", href: "/appointments" },
  { icon: ClipboardList, label: "Passagem de Plantão", href: "/handover" },
  { icon: Bell, label: "Alertas", href: "/alerts" },
  { icon: BarChart3, label: "Relatórios", href: "/reports" },
  { icon: UserCog, label: "Profissionais", href: "/manager/users" },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { state } = useSidebar();

  const menuItems = user?.role === "manager" ? managerMenuItems : baseMenuItems;

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
            <span className="text-xs text-muted-foreground">
              {roleLabels[user.role] ?? user.role}
              {user.shift ? ` • Turno: ${shiftLabels[user.shift] ?? user.shift}` : ""}
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
