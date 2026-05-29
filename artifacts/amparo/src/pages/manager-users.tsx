import { useState } from "react";
import { useListUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserCog, Plus, Pencil, Trash2, UserCheck } from "lucide-react";
import type { StaffUser } from "@workspace/api-client-react";

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

const roleColors: Record<string, string> = {
  nurse: "bg-blue-100 text-blue-800 border-blue-200",
  caregiver: "bg-green-100 text-green-800 border-green-200",
  manager: "bg-purple-100 text-purple-800 border-purple-200",
};

const userSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(4, "Senha deve ter pelo menos 4 caracteres").or(z.literal("")),
  role: z.enum(["nurse", "caregiver", "manager"]),
  shift: z.enum(["morning", "afternoon", "night"]).or(z.literal("")).optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function ManagerUsers() {
  const { data: users, isLoading, refetch } = useListUsers();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffUser | null>(null);
  const [search, setSearch] = useState("");

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: "", email: "", password: "", role: "caregiver", shift: "morning" },
  });

  const openCreate = () => {
    setEditingUser(null);
    form.reset({ name: "", email: "", password: "", role: "caregiver", shift: "morning" });
    setDialogOpen(true);
  };

  const openEdit = (user: StaffUser) => {
    setEditingUser(user);
    form.reset({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role as "nurse" | "caregiver" | "manager",
      shift: (user.shift as "morning" | "afternoon" | "night" | "" | undefined) ?? "",
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: UserFormValues) => {
    const shift = data.shift && data.shift !== "" ? data.shift : undefined;

    if (editingUser) {
      const updates: Record<string, unknown> = { name: data.name, email: data.email, role: data.role, shift: shift ?? null };
      if (data.password) updates.password = data.password;

      updateMutation.mutate(
        { id: editingUser.id, data: updates as any },
        {
          onSuccess: () => {
            toast({ title: "Profissional atualizado com sucesso!" });
            setDialogOpen(false);
            refetch();
          },
          onError: () => {
            toast({ title: "Erro", description: "Falha ao atualizar profissional.", variant: "destructive" });
          },
        }
      );
    } else {
      createMutation.mutate(
        { data: { name: data.name, email: data.email, password: data.password!, role: data.role, shift: shift } as any },
        {
          onSuccess: () => {
            toast({ title: "Profissional cadastrado com sucesso!" });
            setDialogOpen(false);
            refetch();
          },
          onError: () => {
            toast({ title: "Erro", description: "Falha ao cadastrar profissional. Verifique se o e-mail já está em uso.", variant: "destructive" });
          },
        }
      );
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(
      { id: deleteTarget.id },
      {
        onSuccess: () => {
          toast({ title: "Profissional removido com sucesso." });
          setDeleteTarget(null);
          refetch();
        },
        onError: () => {
          toast({ title: "Erro", description: "Falha ao remover profissional.", variant: "destructive" });
        },
      }
    );
  };

  const filtered = users?.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      roleLabels[u.role]?.toLowerCase().includes(search.toLowerCase())
  );

  const roleCounts = users?.reduce(
    (acc, u) => { acc[u.role] = (acc[u.role] ?? 0) + 1; return acc; },
    {} as Record<string, number>
  ) ?? {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
            <UserCog className="h-8 w-8" />
            Gestão de Profissionais
          </h1>
          <p className="text-muted-foreground mt-1">Cadastro e controle da equipe da instituição.</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Profissional
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { role: "nurse", label: "Enfermeiros(as)", color: "text-blue-600 bg-blue-50 border-blue-100" },
          { role: "caregiver", label: "Cuidadores(as)", color: "text-green-600 bg-green-50 border-green-100" },
          { role: "manager", label: "Gestores(as)", color: "text-purple-600 bg-purple-50 border-purple-100" },
        ].map(({ role, label, color }) => (
          <Card key={role} className={`border ${color}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-2xl font-bold">{roleCounts[role] ?? 0}</p>
              </div>
              <UserCheck className="h-8 w-8 opacity-40" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-lg">Equipe Cadastrada</CardTitle>
            <Input
              placeholder="Buscar profissional..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : filtered?.length === 0 ? (
            <div className="text-center p-10 text-muted-foreground">
              Nenhum profissional encontrado.
            </div>
          ) : (
            <div className="divide-y">
              {filtered?.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                      {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${roleColors[user.role]}`}>
                        {roleLabels[user.role] ?? user.role}
                      </Badge>
                      {user.shift && (
                        <Badge variant="outline" className="text-xs">
                          {shiftLabels[user.shift] ?? user.shift}
                        </Badge>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(user)} className="h-8 w-8 p-0">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteTarget(user)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Profissional" : "Novo Profissional"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl><Input placeholder="Ex: Dra. Ana Beatriz Santos" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl><Input type="email" placeholder="profissional@amparo.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>{editingUser ? "Nova senha (deixe em branco para não alterar)" : "Senha"}</FormLabel>
                  <FormControl><Input type="password" placeholder={editingUser ? "••••••••" : "Mínimo 4 caracteres"} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="nurse">Enfermeiro(a)</SelectItem>
                        <SelectItem value="caregiver">Cuidador(a)</SelectItem>
                        <SelectItem value="manager">Gestor(a)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="shift" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turno</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="">Sem turno fixo</SelectItem>
                        <SelectItem value="morning">Manhã</SelectItem>
                        <SelectItem value="afternoon">Tarde</SelectItem>
                        <SelectItem value="night">Noite</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending
                  ? "Salvando..."
                  : editingUser ? "Salvar Alterações" : "Cadastrar Profissional"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Profissional</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{deleteTarget?.name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
