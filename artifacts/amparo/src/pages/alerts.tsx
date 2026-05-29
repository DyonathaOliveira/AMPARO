import { useListAlerts, useResolveAlert } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { AlertTriangle, Info, BellRing, Activity } from "lucide-react";

export default function Alerts() {
  const { data: alerts, isLoading, refetch } = useListAlerts({ resolved: false });
  const resolveMutation = useResolveAlert();
  const { toast } = useToast();

  const handleResolve = (id: number) => {
    resolveMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Alerta resolvido" });
          refetch();
        },
        onError: () => {
          toast({ title: "Erro", description: "Falha ao resolver alerta.", variant: "destructive" });
        }
      }
    );
  };

  const severityConfig: Record<string, { color: string, icon: any, label: string }> = {
    critical: { color: "bg-red-500", icon: AlertTriangle, label: "Crítico" },
    high: { color: "bg-orange-500", icon: BellRing, label: "Alto" },
    medium: { color: "bg-yellow-500 text-yellow-950", icon: Activity, label: "Médio" },
    low: { color: "bg-blue-500", icon: Info, label: "Baixo" }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Central de Alertas</h1>
        <p className="text-muted-foreground">Avisos e intercorrências que exigem atenção.</p>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))
        ) : alerts?.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground bg-card border rounded-lg flex flex-col items-center">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mb-2" />
            Nenhum alerta pendente. Tudo sob controle.
          </div>
        ) : (
          alerts?.map((alert) => {
            const config = severityConfig[alert.severity] || severityConfig.low;
            const Icon = config.icon;
            
            return (
              <Card key={alert.id} className="border-l-4" style={{ borderLeftColor: `var(--${alert.severity === 'critical' ? 'destructive' : alert.severity === 'high' ? 'orange-500' : 'primary'})` }}>
                <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-full ${config.color} bg-opacity-20 mt-1`}>
                      <Icon className={`h-5 w-5 ${config.color.replace('bg-', 'text-').split(' ')[0]}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-lg">{alert.title}</span>
                        <Badge className={`${config.color} border-0 hover:${config.color}`}>{config.label}</Badge>
                        <Badge variant="outline" className="capitalize">{alert.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{alert.message}</p>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        {alert.residentName && <span className="font-medium text-primary">Residente: {alert.residentName}</span>}
                        <span>•</span>
                        <span>{format(new Date(alert.createdAt), "dd/MM/yyyy HH:mm")}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline"
                    onClick={() => handleResolve(alert.id)}
                    disabled={resolveMutation.isPending}
                  >
                    Resolver
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function CheckCircleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
