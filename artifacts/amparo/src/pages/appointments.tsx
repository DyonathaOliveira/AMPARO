import { useState } from "react";
import { useListAppointments, useUpdateAppointment } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Appointments() {
  const { data: appointments, isLoading, refetch } = useListAppointments();
  const updateMutation = useUpdateAppointment();
  const { toast } = useToast();

  const handleUpdateStatus = (id: number, status: 'confirmed' | 'completed' | 'cancelled') => {
    updateMutation.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          toast({ title: "Status atualizado" });
          refetch();
        },
        onError: () => {
          toast({ title: "Erro", description: "Falha ao atualizar agendamento.", variant: "destructive" });
        }
      }
    );
  };

  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-500",
    confirmed: "bg-teal-500",
    completed: "bg-green-500",
    cancelled: "bg-red-500"
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Agendamentos</h1>
          <p className="text-muted-foreground">Consultas e exames dos residentes.</p>
        </div>
        <Button>Novo Agendamento</Button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))
        ) : appointments?.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground bg-card border rounded-lg">
            Nenhum agendamento encontrado.
          </div>
        ) : (
          appointments?.map((app) => (
            <Card key={app.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-lg">{app.residentName}</span>
                    <Badge variant="outline">{app.specialty}</Badge>
                    <Badge className={`${statusColors[app.status]} text-white border-0`}>
                      {app.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Data: {format(new Date(app.date), "dd/MM/yyyy")} às {app.time}
                  </div>
                  {app.observations && (
                    <div className="text-sm mt-1 italic text-muted-foreground">
                      Obs: {app.observations}
                    </div>
                  )}
                </div>
                
                {app.status === 'scheduled' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(app.id, 'cancelled')}>Cancelar</Button>
                    <Button size="sm" onClick={() => handleUpdateStatus(app.id, 'confirmed')}>Confirmar</Button>
                  </div>
                )}
                {app.status === 'confirmed' && (
                  <Button size="sm" onClick={() => handleUpdateStatus(app.id, 'completed')}>Marcar como Realizado</Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
