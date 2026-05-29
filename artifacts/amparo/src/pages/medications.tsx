import { useState } from "react";
import { useListMedications, useAdministerMedication } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Medications() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: medications, isLoading, refetch } = useListMedications(
    statusFilter !== "all" ? { status: statusFilter as any } : undefined
  );
  
  const administerMutation = useAdministerMedication();
  const { toast } = useToast();

  const handleAdminister = (id: number) => {
    administerMutation.mutate(
      { id, data: { administeredAt: new Date().toISOString(), administeredBy: "Current User" } },
      {
        onSuccess: () => {
          toast({ title: "Sucesso", description: "Medicação administrada com sucesso." });
          refetch();
        },
        onError: () => {
          toast({ title: "Erro", description: "Falha ao registrar administração.", variant: "destructive" });
        }
      }
    );
  };

  const statusColors: Record<string, string> = {
    administered: "bg-green-500",
    pending: "bg-yellow-500",
    late: "bg-red-500"
  };

  const statusLabels: Record<string, string> = {
    administered: "Administrado",
    pending: "Pendente",
    late: "Atrasado"
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Controle de Medicações</h1>
          <p className="text-muted-foreground">Gerencie a administração de medicamentos dos residentes.</p>
        </div>
        <div className="w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="late">Atrasados</SelectItem>
              <SelectItem value="administered">Administrados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))
        ) : medications?.length === 0 ? (
          <div className="col-span-full text-center p-8 text-muted-foreground bg-card border rounded-lg">
            Nenhuma medicação encontrada.
          </div>
        ) : (
          medications?.map((med) => (
            <Card key={med.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{med.name}</CardTitle>
                  <Badge className={`${statusColors[med.status]} text-white hover:${statusColors[med.status]}`}>
                    {statusLabels[med.status]}
                  </Badge>
                </div>
                <CardDescription>{med.residentName}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm">
                  <span className="font-semibold block">Dose e Frequência:</span>
                  {med.dose} • {med.frequency}
                </div>
                <div className="text-sm">
                  <span className="font-semibold block">Horários:</span>
                  <div className="flex gap-1 flex-wrap mt-1">
                    {med.scheduledTimes.map(t => <Badge key={t} variant="outline">{t}</Badge>)}
                  </div>
                </div>
                {med.status !== 'administered' && (
                  <Button 
                    className="w-full mt-2" 
                    onClick={() => handleAdminister(med.id)}
                    disabled={administerMutation.isPending}
                  >
                    Confirmar Administração
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
