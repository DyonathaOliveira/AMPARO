import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { AppSidebar } from "./app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useGetLatestHandover, useConfirmHandoverRead } from "@workspace/api-client-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated && location !== "/login") {
      setLocation("/login");
    }
  }, [isAuthenticated, location, setLocation]);

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b bg-card flex items-center px-4 shrink-0">
            <SidebarTrigger />
            <div className="ml-auto">
              <HandoverBanner />
            </div>
          </header>
          <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

function HandoverBanner() {
  const { data: latestHandover, refetch } = useGetLatestHandover({ query: { enabled: true } });
  const confirmRead = useConfirmHandoverRead();

  if (!latestHandover || latestHandover.isRead) {
    return null;
  }

  return (
    <Alert variant="default" className="bg-blue-50 border-blue-200 py-2 flex items-center gap-4 m-0 shadow-sm max-w-lg">
      <ClipboardList className="h-4 w-4 text-blue-600" />
      <div className="flex-1">
        <AlertTitle className="text-sm text-blue-900 m-0">Passagem de Plantão Pendente</AlertTitle>
      </div>
      <Button 
        size="sm" 
        variant="outline" 
        className="h-7 text-xs bg-white hover:bg-blue-50 text-blue-700 border-blue-300"
        onClick={() => {
          confirmRead.mutate(
            { id: latestHandover.id },
            {
              onSuccess: () => refetch(),
            }
          );
        }}
        disabled={confirmRead.isPending}
      >
        {confirmRead.isPending ? "Confirmando..." : "Confirmar Leitura"}
      </Button>
    </Alert>
  );
}
