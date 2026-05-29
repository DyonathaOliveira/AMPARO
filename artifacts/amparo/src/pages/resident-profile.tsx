import { useLocation, useParams } from "wouter";
import { useGetResidentProfile } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ResidentProfile() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const residentId = parseInt(id, 10);
  
  const { data: profile, isLoading } = useGetResidentProfile(residentId, {
    query: { enabled: !!id, queryKey: ["resident-profile", residentId] }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (!profile) {
    return <div>Residente não encontrado.</div>;
  }

  const { resident, medications, activities, appointments, handoverNotes } = profile;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setLocation("/residents")}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
            {resident.name}
            <Badge variant={resident.status === 'active' ? 'default' : 'secondary'}>
              {resident.status === 'active' ? 'Ativo' : 'Inativo'}
            </Badge>
          </h1>
          <p className="text-muted-foreground">Quarto {resident.room}</p>
        </div>
        <Button onClick={() => setLocation(`/residents/${resident.id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" /> Editar
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <span className="font-semibold block">Data de Nascimento</span>
              {format(new Date(resident.dateOfBirth), "dd/MM/yyyy", { locale: ptBR })}
            </div>
            <div>
              <span className="font-semibold block">CPF</span>
              {resident.cpf || "Não informado"}
            </div>
            <div>
              <span className="font-semibold block">Data de Admissão</span>
              {format(new Date(resident.admissionDate), "dd/MM/yyyy", { locale: ptBR })}
            </div>
            <div className="pt-4 border-t border-border">
              <span className="font-semibold block text-primary">Contato Familiar</span>
              {resident.familyContact || "Não informado"}
              <br />
              {resident.familyPhone || ""}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informações Clínicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <span className="font-semibold block">Diagnósticos</span>
              <p className="text-muted-foreground whitespace-pre-wrap">{resident.diagnoses || "Nenhum diagnóstico registrado."}</p>
            </div>
            <div>
              <span className="font-semibold block">Alergias</span>
              <p className="text-destructive font-medium">{resident.allergies || "Nenhuma alergia conhecida."}</p>
            </div>
            <div>
              <span className="font-semibold block">Notas Clínicas</span>
              <p className="text-muted-foreground whitespace-pre-wrap">{resident.clinicalNotes || "Sem notas."}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="medications">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger value="medications" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
            Medicações
          </TabsTrigger>
          <TabsTrigger value="activities" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
            Atividades
          </TabsTrigger>
          <TabsTrigger value="appointments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
            Agendamentos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="medications" className="pt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {medications.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma medicação prescrita.</p>
            ) : (
              medications.map((med) => (
                <Card key={med.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{med.name}</CardTitle>
                    <CardDescription>{med.dose} • {med.frequency}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 flex-wrap mb-2">
                      {med.scheduledTimes.map(t => (
                        <Badge key={t} variant="outline">{t}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="activities" className="pt-4">
           {activities.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma atividade recente.</p>
            ) : (
              <div className="space-y-2">
                {activities.map(act => (
                  <div key={act.id} className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <p className="font-medium capitalize">{act.type}</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(act.date), "dd/MM/yyyy")} {act.time && `às ${act.time}`}</p>
                    </div>
                    <Badge variant={act.status === 'completed' ? 'default' : 'secondary'} className={act.status === 'completed' ? 'bg-accent' : ''}>
                      {act.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
        </TabsContent>
        
        <TabsContent value="appointments" className="pt-4">
            {appointments.length === 0 ? (
              <p className="text-muted-foreground">Nenhum agendamento.</p>
            ) : (
              <div className="space-y-2">
                {appointments.map(app => (
                  <div key={app.id} className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <p className="font-medium">{app.specialty}</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(app.date), "dd/MM/yyyy")} às {app.time}</p>
                    </div>
                    <Badge variant="outline">{app.status}</Badge>
                  </div>
                ))}
              </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
