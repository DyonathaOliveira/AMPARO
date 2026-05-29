import { useState } from "react";
import { useListActivities, useUpdateActivity } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, X } from "lucide-react";

export default function Activities() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const { data: activities, isLoading, refetch } = useListActivities({ date });
  const updateMutation = useUpdateActivity();
  const { toast } = useToast();

  const handleUpdateStatus = (id: number, status: 'completed' | 'not_done') => {
    updateMutation.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          toast({ title: "Status atualizado" });
          refetch();
        },
        onError: () => {
          toast({ title: "Erro", description: "Falha ao atualizar.", variant: "destructive" });
        }
      }
    );
  };

  const statusColors: Record<string, string> = {
    completed: "bg-green-500",
    pending: "bg-yellow-500",
    not_done: "bg-red-500"
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Atividades Diárias</h1>
          <p className="text-muted-foreground">Checklist de cuidados e rotina.</p>
        </div>
        <div className="w-48">
          <Input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
          />
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))
        ) : activities?.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground bg-card border rounded-lg">
            Nenhuma atividade para esta data.
          </div>
        ) : (
          activities?.map((act) => (
            <Card key={act.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-lg">{act.residentName}</span>
                    <Badge variant="outline" className="capitalize">{act.type}</Badge>
                    <Badge className={`${statusColors[act.status]} text-white border-0 hover:${statusColors[act.status]}`}>
                      {act.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Turno: {act.shift} {act.time && `• Horário: ${act.time}`}
                  </div>
                  {act.observations && (
                    <div className="text-sm mt-1 italic text-muted-foreground">
                      Obs: {act.observations}
                    </div>
                  )}
                </div>
                
                {act.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleUpdateStatus(act.id, 'not_done')}
                      disabled={updateMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-1" /> Não Realizada
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleUpdateStatus(act.id, 'completed')}
                      disabled={updateMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" /> Concluir
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
