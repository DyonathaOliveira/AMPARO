import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGetResident, useCreateResident, useUpdateResident, getGetResidentQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const residentSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().optional(),
  dateOfBirth: z.string().min(1, "Data de nascimento é obrigatória"),
  gender: z.enum(["male", "female", "other"]),
  room: z.string().min(1, "Quarto é obrigatório"),
  admissionDate: z.string().min(1, "Data de admissão é obrigatória"),
  diagnoses: z.string().optional(),
  allergies: z.string().optional(),
  familyContact: z.string().optional(),
  familyPhone: z.string().optional(),
  clinicalNotes: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

type ResidentFormValues = z.infer<typeof residentSchema>;

export default function ResidentForm() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id && id !== "new";
  const residentId = isEditing ? parseInt(id, 10) : undefined;
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: resident, isLoading } = useGetResident(residentId!, {
    query: { enabled: isEditing, queryKey: getGetResidentQueryKey(residentId!) }
  });

  const createMutation = useCreateResident();
  const updateMutation = useUpdateResident();

  const form = useForm<ResidentFormValues>({
    resolver: zodResolver(residentSchema),
    defaultValues: {
      name: "",
      cpf: "",
      dateOfBirth: "",
      gender: "male",
      room: "",
      admissionDate: new Date().toISOString().split("T")[0],
      diagnoses: "",
      allergies: "",
      familyContact: "",
      familyPhone: "",
      clinicalNotes: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (resident && isEditing) {
      form.reset({
        name: resident.name,
        cpf: resident.cpf || "",
        dateOfBirth: resident.dateOfBirth.split("T")[0],
        gender: resident.gender,
        room: resident.room,
        admissionDate: resident.admissionDate.split("T")[0],
        diagnoses: resident.diagnoses || "",
        allergies: resident.allergies || "",
        familyContact: resident.familyContact || "",
        familyPhone: resident.familyPhone || "",
        clinicalNotes: resident.clinicalNotes || "",
        status: resident.status,
      });
    }
  }, [resident, isEditing, form]);

  const onSubmit = (data: ResidentFormValues) => {
    if (isEditing) {
      updateMutation.mutate(
        { id: residentId!, data },
        {
          onSuccess: () => {
            toast({ title: "Sucesso", description: "Residente atualizado." });
            queryClient.invalidateQueries({ queryKey: getGetResidentQueryKey(residentId!) });
            setLocation(`/residents/${residentId}`);
          },
          onError: () => {
            toast({ title: "Erro", description: "Erro ao atualizar residente.", variant: "destructive" });
          }
        }
      );
    } else {
      createMutation.mutate(
        { data },
        {
          onSuccess: (newResident) => {
            toast({ title: "Sucesso", description: "Residente cadastrado." });
            setLocation(`/residents/${newResident.id}`);
          },
          onError: () => {
            toast({ title: "Erro", description: "Erro ao cadastrar residente.", variant: "destructive" });
          }
        }
      );
    }
  };

  if (isEditing && isLoading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setLocation(isEditing ? `/residents/${residentId}` : "/residents")}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            {isEditing ? "Editar Residente" : "Novo Residente"}
          </h1>
          <p className="text-muted-foreground">Preencha os dados do residente.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="cpf" render={({ field }) => (
                <FormItem><FormLabel>CPF</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                <FormItem><FormLabel>Data de Nascimento</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="gender" render={({ field }) => (
                <FormItem><FormLabel>Gênero</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Feminino</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="room" render={({ field }) => (
                <FormItem><FormLabel>Quarto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="admissionDate" render={({ field }) => (
                <FormItem><FormLabel>Data de Admissão</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              {isEditing && (
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações Clínicas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <FormField control={form.control} name="diagnoses" render={({ field }) => (
                <FormItem><FormLabel>Diagnósticos</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="allergies" render={({ field }) => (
                <FormItem><FormLabel>Alergias</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="clinicalNotes" render={({ field }) => (
                <FormItem><FormLabel>Notas Clínicas Iniciais</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contato Familiar</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="familyContact" render={({ field }) => (
                <FormItem><FormLabel>Nome do Contato</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="familyPhone" render={({ field }) => (
                <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={() => setLocation(isEditing ? `/residents/${residentId}` : "/residents")}>Cancelar</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar Residente"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
