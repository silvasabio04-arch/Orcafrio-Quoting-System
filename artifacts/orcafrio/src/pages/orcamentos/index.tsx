import { useState } from "react";
import { Link } from "wouter";
import { useListOrcamentos } from "@workspace/api-client-react";
import { Plus, Search, FileText, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/format";
import { getStatusColor, getStatusLabel } from "@/pages/dashboard";
import { ListOrcamentosStatus } from "@workspace/api-client-react";

export default function OrcamentosList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("todos");

  const queryParams = {
    search: search || undefined,
    status: status !== "todos" ? (status as ListOrcamentosStatus) : undefined,
  };

  const { data: orcamentos, isLoading } = useListOrcamentos(queryParams);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orçamentos</h1>
          <p className="text-muted-foreground">Gerencie todos os seus orçamentos</p>
        </div>
        <Link href="/orcamentos/novo" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto h-12 sm:h-10">
            <Plus className="mr-2 h-5 w-5" />
            Novo Orçamento
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Buscar por cliente ou número..." 
            className="pl-10 h-12 sm:h-10 text-base sm:text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="rascunho">Rascunho</SelectItem>
              <SelectItem value="enviado">Enviado</SelectItem>
              <SelectItem value="aprovado">Aprovado</SelectItem>
              <SelectItem value="recusado">Recusado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : orcamentos && orcamentos.length > 0 ? (
        <div className="grid gap-3">
          {orcamentos.map((orcamento) => (
            <Link key={orcamento.id} href={`/orcamentos/${orcamento.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer border shadow-sm">
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-lg leading-tight">{orcamento.clienteNome}</p>
                    <Badge variant="outline" className={`shrink-0 border-0 ${getStatusColor(orcamento.status)}`}>
                      {getStatusLabel(orcamento.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">{orcamento.numero}</span>
                      <span>•</span>
                      <span>{formatDate(orcamento.createdAt)}</span>
                    </div>
                    <span className="font-bold text-lg">{formatCurrency(orcamento.total)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium mb-2">Nenhum orçamento encontrado</h3>
          <p className="text-muted-foreground mb-6">
            {search || status !== "todos" 
              ? "Tente ajustar os filtros de busca para encontrar o que precisa." 
              : "Você ainda não criou nenhum orçamento. Comece agora!"}
          </p>
          {(search || status !== "todos") ? (
            <Button variant="outline" onClick={() => { setSearch(""); setStatus("todos"); }}>
              Limpar Filtros
            </Button>
          ) : (
            <Link href="/orcamentos/novo">
              <Button size="lg">Criar primeiro orçamento</Button>
            </Link>
          )}
        </Card>
      )}
    </div>
  );
}
