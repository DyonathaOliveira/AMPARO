import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListResidents } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Residents() {
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();
  const { data: residents, isLoading } = useListResidents({ search: search || undefined });

  const calculateAge = (dob: string) => {
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Residentes</h1>
          <p className="text-muted-foreground">Gerenciamento de idosos na instituição.</p>
        </div>
        <Button asChild>
          <Link href="/residents/new">
            <Plus className="mr-2 h-4 w-4" /> Novo Residente
          </Link>
        </Button>
      </div>

      <div className="flex items-center w-full max-w-sm relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por nome ou quarto..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Quarto</TableHead>
              <TableHead>Idade</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : residents?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                  Nenhum residente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              residents?.map((resident) => (
                <TableRow 
                  key={resident.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setLocation(`/residents/${resident.id}`)}
                >
                  <TableCell className="font-medium">{resident.name}</TableCell>
                  <TableCell>{resident.room}</TableCell>
                  <TableCell>{calculateAge(resident.dateOfBirth)} anos</TableCell>
                  <TableCell>
                    <Badge variant={resident.status === 'active' ? 'default' : 'secondary'} className={resident.status === 'active' ? 'bg-primary' : ''}>
                      {resident.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
