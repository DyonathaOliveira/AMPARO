import { useState } from "react";
import { useListActivities, useUpdateActivity, useCreateActivity, useListResidents } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Check, X, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const activityTypeLabels: Record<string, string> = {
  bath: "Banho",
  feeding: "Alimentação",
  hygiene: "Higiene",
  physiotherapy: "Fisioterapia",
  medication: "Medicação",
  other: "Outro",
};

const statusLabels: Record<string, string> = {
  completed: "Concluído",
  pending: "Pendente",
  not_done: "Não Realizada",
};

const shiftLabels: Record<string, string> = {
  morning: "Manhã",
  afternoon: "Tarde",
  night: "Noite",
};

const statusColors: Record<string, string> = {
  completed: "bg-green-500",
  pending: "bg-yellow-500",
  not_done: "bg-red-500",
};

const newActivitySchema = z.object({
  residentId: z.coerce.number().min(1, "Selecione um residente"),
  type: z.enum(["bath", "feeding", "hygiene", "physiotherapy", "medication", "other"]),
  date: z.string().min(1, "Informe a data"),
  shift: z.enum(["morning", "afternoon", "night"]),
  time: z.string().optional(),
  observations: z.string().optional(),
});

type NewActivityValues = z.infer<typeof newActivitySchema>;

export default function Activities() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [open, setOpen] = useState(false);
  const { data: activities, isLoading, refetch } = useListActivities({ date });
  const updateMutation = useUpdateActivity();
  const createMutation = useCreateActivity();
  const { data: residents } = useListResidents();
  const { toast } = useToast();

  const form = useForm<NewActivityValues>({
    resolver: zodResolver(newActivitySchema),
    defaultValues: {
      residentId: 0,
      type: "bath",
      date: format(new Date(), "yyyy-MM-dd"),
      shift: "morning",
      time: "",
      observations: "",
    },
  });

  const handleUpdateStatus = (id: number, status: "completed" | "not_done") => {
    updateMutation.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          toast({ title: status === "completed" ? "Atividade concluída!" : "Atividade marcada como não realizada." });
          refetch();
        },
        onError: () => {
          toast({ title: "Erro", description: "Falha ao atualizar atividade.", variant: "destructive" });
        },
      }
    );
  };

  const onSubmit = (data: NewActivityValues) => {
    createMutation.mutate(
      {
        data: {
          residentId: data.residentId,
          type: data.type,
          date: data.date,
          shift: data.shift,
          time: data.time || undefined,
          observations: data.observations || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Atividade cadastrada com sucesso!" });
          setOpen(false);
          form.reset();
          refetch();
        },
        onError: () => {
          toast({ title: "Erro", description: "Falha ao cadastrar atividade.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Atividades Diárias</h1>
          <p className="text-muted-foreground">Checklist de cuidados e rotina por turno.</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44"
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Atividade
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>Nova Atividade</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="residentId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Residente</FormLabel>
                      <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value ? String(field.value) : ""}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione o residente..." /></SelectTrigger></FormControl>
                        <SelectContent>
                          {residents?.map((r) => (
                            <SelectItem key={r.id} value={String(r.id)}>{r.name} — Quarto {r.room}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="type" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Atividade</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {Object.entries(activityTypeLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="shift" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Turno</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="morning">Manhã</SelectItem>
                            <SelectItem value="afternoon">Tarde</SelectItem>
                            <SelectItem value="night">Noite</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="date" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="time" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário (opcional)</FormLabel>
                        <FormControl><Input type="time" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="observations" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações (opcional)</FormLabel>
                      <FormControl><Textarea placeholder="Descreva observações relevantes..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Cadastrando..." : "Cadastrar Atividade"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))
        ) : activities?.length === 0 ? (
          <div className="text-center p-10 text-muted-foreground bg-card border rounded-lg">
            <CheckSquareIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p>Nenhuma atividade registrada para esta data.</p>
            <p className="text-sm mt-1">Clique em "Adicionar Atividade" para registrar.</p>
          </div>
        ) : (
          activities?.map((act) => (
            <Card key={act.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-base">{act.residentName}</span>
                    <Badge variant="outline">{activityTypeLabels[act.type] ?? act.type}</Badge>
                    <Badge className={`${statusColors[act.status]} text-white border-0 hover:opacity-90`}>
                      {statusLabels[act.status] ?? act.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Turno: {act.shift ? (shiftLabels[act.shift] ?? act.shift) : ""}
                    {act.time && ` • Horário: ${act.time}`}
                  </div>
                  {act.observations && (
                    <div className="text-sm mt-1 italic text-muted-foreground">
                      Obs: {act.observations}
                    </div>
                  )}
                </div>

                {act.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleUpdateStatus(act.id, "not_done")}
                      disabled={updateMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-1" /> Não Realizada
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleUpdateStatus(act.id, "completed")}
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

function CheckSquareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
