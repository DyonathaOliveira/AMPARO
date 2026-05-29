import { useListHandovers, useCreateHandover } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

const handoverSchema = z.object({
  shift: z.enum(["morning", "afternoon", "night"]),
  occurrences: z.string().min(1, "Ocorrências são obrigatórias"),
  pendencies: z.string().optional(),
});

type HandoverFormValues = z.infer<typeof handoverSchema>;

export default function Handover() {
  const { data: handovers, isLoading, refetch } = useListHandovers();
  const createMutation = useCreateHandover();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<HandoverFormValues>({
    resolver: zodResolver(handoverSchema),
    defaultValues: { shift: "morning", occurrences: "", pendencies: "" },
  });

  const onSubmit = (data: HandoverFormValues) => {
    createMutation.mutate(
      { data },
      {
        onSuccess: () => {
          toast({ title: "Sucesso", description: "Passagem de plantão registrada." });
          setOpen(false);
          form.reset();
          refetch();
        },
        onError: () => {
          toast({ title: "Erro", description: "Falha ao registrar.", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Passagem de Plantão</h1>
          <p className="text-muted-foreground">Histórico e registro de turnos.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Registrar Plantão</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Nova Passagem de Plantão</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="shift" render={({ field }) => (
                  <FormItem><FormLabel>Turno</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="morning">Manhã</SelectItem>
                        <SelectItem value="afternoon">Tarde</SelectItem>
                        <SelectItem value="night">Noite</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="occurrences" render={({ field }) => (
                  <FormItem><FormLabel>Ocorrências do Turno</FormLabel><FormControl><Textarea className="h-32" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="pendencies" render={({ field }) => (
                  <FormItem><FormLabel>Pendências para o próximo turno</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Registrando..." : "Registrar Passagem"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))
        ) : handovers?.length === 0 ? (
           <div className="text-center p-8 text-muted-foreground bg-card border rounded-lg">
            Nenhuma passagem de plantão registrada.
          </div>
        ) : (
          handovers?.map((ho) => (
            <Card key={ho.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Turno: <span className="capitalize">{ho.shift}</span>
                      {!ho.isRead && <Badge variant="destructive">Não Lido</Badge>}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      Por {ho.createdBy} em {format(new Date(ho.date || ho.createdAt || Date.now()), "dd/MM/yyyy 'às' HH:mm")}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-1">Ocorrências</h4>
                  <p className="text-sm whitespace-pre-wrap">{ho.occurrences}</p>
                </div>
                {ho.pendencies && (
                  <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                    <h4 className="font-semibold text-sm text-yellow-800 mb-1">Pendências</h4>
                    <p className="text-sm text-yellow-900 whitespace-pre-wrap">{ho.pendencies}</p>
                  </div>
                )}
                {ho.isRead && ho.readBy && (
                  <div className="text-xs text-muted-foreground mt-4 text-right">
                    Lido por {ho.readBy} em {ho.readAt ? format(new Date(ho.readAt), "dd/MM/yyyy HH:mm") : ""}
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
