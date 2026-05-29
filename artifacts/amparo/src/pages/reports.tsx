import { useState } from "react";
import { useGetShiftReport } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge, Download, FileText } from "lucide-react";
import { format } from "date-fns";

export default function Reports() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [shift, setShift] = useState("all");
  
  const { data: report, isLoading } = useGetShiftReport({
    startDate: date,
    endDate: date,
    shift: shift !== "all" ? shift as any : undefined
  });
  
  const { toast } = useToast();

  const handleExportPDF = () => {
    toast({
      title: "Gerando PDF",
      description: "O download iniciará em instantes.",
    });
    // Simulated PDF export
    setTimeout(() => {
      toast({ title: "Sucesso", description: "Relatório exportado com sucesso." });
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Relatórios</h1>
          <p className="text-muted-foreground">Consolidação de dados do sistema.</p>
        </div>
        <Button onClick={handleExportPDF} className="gap-2">
          <Download className="h-4 w-4" /> Exportar PDF
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 flex gap-4 flex-wrap">
          <div className="w-full sm:w-auto">
            <label className="text-sm font-medium mb-1 block">Data</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="w-full sm:w-auto min-w-[200px]">
            <label className="text-sm font-medium mb-1 block">Turno</label>
            <Select value={shift} onValueChange={setShift}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o turno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Turnos</SelectItem>
                <SelectItem value="morning">Manhã</SelectItem>
                <SelectItem value="afternoon">Tarde</SelectItem>
                <SelectItem value="night">Noite</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : report ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Residentes Atendidos</p>
                <p className="text-3xl font-bold text-primary">{report.totalResidents}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Medicações</p>
                <p className="text-3xl font-bold text-green-600">{report.medicationsAdministered}</p>
                <p className="text-xs text-muted-foreground">{report.medicationsPending || 0} pendentes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Atividades</p>
                <p className="text-3xl font-bold text-blue-600">{report.activitiesCompleted}</p>
                <p className="text-xs text-muted-foreground">{report.activitiesPending || 0} pendentes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Alertas Gerados</p>
                <p className="text-3xl font-bold text-red-500">{report.alerts}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Detalhamento do Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report.details && report.details.length > 0 ? (
                <div className="space-y-4">
                  {report.details.map((detail, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-4 border-b last:border-0 pb-4 last:pb-0">
                      <div className="w-32 text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(detail.timestamp), "HH:mm")}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{detail.type}</Badge>
                          <span className="font-medium">{detail.residentName}</span>
                        </div>
                        <p className="text-sm mt-1">{detail.description}</p>
                        {detail.responsibleUser && (
                          <p className="text-xs text-muted-foreground mt-1">Resp: {detail.responsibleUser}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Não há registros detalhados para este período.</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center p-8 text-muted-foreground bg-card border rounded-lg">
          Nenhum relatório disponível para os filtros selecionados.
        </div>
      )}
    </div>
  );
}
