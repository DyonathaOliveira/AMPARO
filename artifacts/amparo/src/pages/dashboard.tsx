import { useAuth } from "@/hooks/use-auth";
import { useGetDashboardSummary, useGetDashboardAlerts } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Calendar, CheckSquare, Pill, Users } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: alerts, isLoading: loadingAlerts } = useGetDashboardAlerts();

  const medicationData = summary?.medicationStats ? [
    { name: 'Administradas', value: summary.medicationStats.administered || 0, color: 'hsl(142 71% 45%)' },
    { name: 'Pendentes', value: summary.medicationStats.pending || 0, color: 'hsl(43 74% 66%)' },
    { name: 'Atrasadas', value: summary.medicationStats.late || 0, color: 'hsl(0 84% 60%)' },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Olá, {user?.name}</h1>
        <p className="text-muted-foreground">Aqui está o resumo do seu plantão ({user?.shift}).</p>
      </div>

      {loadingSummary ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Residentes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalResidents}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Medicações Pendentes</CardTitle>
              <Pill className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.pendingMedications}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atividades Abertas</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.openActivities}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.todayAppointments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas Atrasados</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{summary.lateAlerts}</div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Feed de Atividades Recentes</CardTitle>
            <CardDescription>Acontecimentos mais recentes no sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : summary?.recentActivity && summary.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {summary.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 rounded-lg border p-3">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{activity.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.residentName ? `${activity.residentName} • ` : ""}{new Date(activity.time).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 text-muted-foreground">Nenhuma atividade recente.</div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Status de Medicações</CardTitle>
            <CardDescription>Distribuição de medicações do dia.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loadingSummary ? (
              <Skeleton className="h-full w-full rounded-full" />
            ) : summary?.medicationStats ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={medicationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {medicationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Sem dados de medicações.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
