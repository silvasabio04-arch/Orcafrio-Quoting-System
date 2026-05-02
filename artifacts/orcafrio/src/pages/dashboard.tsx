import { useGetDashboardResumo, useGetOrcamentosRecentes } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Plus, FileText, CheckCircle, Clock, DollarSign, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";

export function getStatusColor(status: string) {
  switch (status) {
    case "aprovado": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "recusado": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case "enviado": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "cancelado": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    case "rascunho": default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case "aprovado": return "Aprovado";
    case "recusado": return "Recusado";
    case "enviado": return "Enviado";
    case "cancelado": return "Cancelado";
    case "rascunho": default: return "Rascunho";
  }
}

export default function Dashboard() {
  const { data: resumo, isLoading: isLoadingResumo } = useGetDashboardResumo();
  const { data: recentes, isLoading: isLoadingRecentes } = useGetOrcamentosRecentes();

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
          <p className="text-muted-foreground">Resumo dos seus orçamentos</p>
        </div>
        <Link href="/orcamentos/novo" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto flex items-center gap-2 h-12 sm:h-10 text-base sm:text-sm">
            <Plus className="h-5 w-5" />
            Novo Orçamento
          </Button>
        </Link>
      </div>

      {isLoadingResumo ? (
        <div className="grid gap-4 grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      ) : resumo ? (
        <div className="grid gap-4 grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resumo.totalOrcamentos}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-500">{resumo.porStatus.aprovado || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">{resumo.porStatus.enviado || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Esperada</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(resumo.valorTotalPendente + resumo.valorTotalAprovado)}</div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Orçamentos Recentes</h2>
          <Link href="/orcamentos" className="text-sm font-medium text-primary flex items-center gap-1">
            Ver todos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoadingRecentes ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : recentes && recentes.length > 0 ? (
          <div className="space-y-3">
            {recentes.map((orcamento) => (
              <Link key={orcamento.id} href={`/orcamentos/${orcamento.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer border shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-base leading-none">{orcamento.clienteNome}</p>
                      <p className="text-sm text-muted-foreground">{orcamento.numero}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="font-semibold">{formatCurrency(orcamento.total)}</span>
                      <Badge variant="outline" className={`border-0 ${getStatusColor(orcamento.status)}`}>
                        {getStatusLabel(orcamento.status)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-center justify-center p-8 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">Nenhum orçamento</h3>
            <p className="text-muted-foreground text-sm mb-4">Você ainda não criou nenhum orçamento.</p>
            <Link href="/orcamentos/novo">
              <Button>Criar primeiro orçamento</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
