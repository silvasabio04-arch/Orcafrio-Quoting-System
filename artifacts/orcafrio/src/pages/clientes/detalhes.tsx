import { useRef, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useGetCliente, useDeleteCliente, useListOrcamentos } from "@workspace/api-client-react";
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, Trash2, FileText, Download, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/format";
import { getStatusColor, getStatusLabel } from "@/pages/dashboard";
import { useTecnicoProfile } from "@/lib/tecnico";

export default function ClienteDetalhes() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const tecnico = useTecnicoProfile();
  const exportRef = useRef<HTMLDivElement>(null);
  const [exportando, setExportando] = useState(false);

  const { data: cliente, isLoading } = useGetCliente(Number(id), {
    query: { enabled: !!id },
  });

  const { data: orcamentos, isLoading: loadingOrc } = useListOrcamentos(
    { clienteId: Number(id) },
    { query: { enabled: !!id } }
  );

  const deleteCliente = useDeleteCliente();

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.")) {
      deleteCliente.mutate(
        { id: Number(id) },
        {
          onSuccess: () => {
            toast({ title: "Cliente excluído com sucesso" });
            setLocation("/clientes");
          },
          onError: () => {
            toast({
              title: "Erro ao excluir cliente",
              description: "Verifique se o cliente não possui orçamentos vinculados.",
              variant: "destructive",
            });
          },
        }
      );
    }
  };

  const handleExportarPdf = async () => {
    if (!exportRef.current) return;
    setExportando(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const el = exportRef.current;
      await html2pdf()
        .set({
          margin: 0,
          filename: `Historico-${cliente?.nome ?? id}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(el)
        .save();
    } catch {
      toast({ title: "Erro ao gerar PDF", variant: "destructive" });
    } finally {
      setExportando(false);
    }
  };

  const totalGeral = orcamentos?.reduce((acc, o) => acc + o.total, 0) ?? 0;
  const qtdAprovados = orcamentos?.filter(o => o.status === "aprovado").length ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Cliente não encontrado</h2>
        <p className="text-muted-foreground mt-2 mb-6">O cliente que você está procurando não existe ou foi excluído.</p>
        <Link href="/clientes">
          <Button>Voltar para Clientes</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/clientes">
            <Button variant="outline" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Detalhes do Cliente</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleExportarPdf}
            disabled={exportando || !orcamentos?.length}
            title="Exportar histórico de orçamentos"
          >
            {exportando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          </Button>
          <Button variant="destructive" size="icon" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Client info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">{cliente.nome}</CardTitle>
              {cliente.cpfCnpj && <p className="text-muted-foreground mt-1">CPF/CNPJ: {cliente.cpfCnpj}</p>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Phone className="h-4 w-4" /> Telefone
            </div>
            <p className="text-lg">{cliente.telefone}</p>
          </div>

          {cliente.email && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Mail className="h-4 w-4" /> E-mail
              </div>
              <p className="text-lg break-all">{cliente.email}</p>
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" /> Cliente Desde
            </div>
            <p className="text-lg">{formatDate(cliente.createdAt)}</p>
          </div>

          {cliente.endereco && (
            <div className="space-y-1 sm:col-span-2 lg:col-span-4 border-t pt-4 mt-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <MapPin className="h-4 w-4" /> Endereço
              </div>
              <p className="text-lg">{cliente.endereco}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary stats */}
      {!!orcamentos?.length && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold">{orcamentos.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Orçamentos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-green-600">{qtdAprovados}</p>
              <p className="text-xs text-muted-foreground mt-1">Aprovados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-lg font-bold text-blue-700">{formatCurrency(totalGeral)}</p>
              <p className="text-xs text-muted-foreground mt-1">Total</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Orçamentos list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" /> Orçamentos
          </h2>
          {!!orcamentos?.length && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportarPdf}
              disabled={exportando}
              className="gap-2"
            >
              {exportando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Exportar PDF
            </Button>
          )}
        </div>

        {loadingOrc && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        )}

        {!loadingOrc && !orcamentos?.length && (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum orçamento para este cliente ainda.</p>
            <Link href={`/orcamentos/novo`}>
              <Button size="sm" className="mt-4">Criar Orçamento</Button>
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {orcamentos?.map(orc => (
            <Link key={orc.id} href={`/orcamentos/${orc.id}`}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-4 px-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{orc.numero}</span>
                        <Badge className={`text-xs ${getStatusColor(orc.status)}`}>
                          {getStatusLabel(orc.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(orc.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold text-base">{formatCurrency(orc.total)}</span>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Hidden export PDF template */}
      {!!orcamentos?.length && (
        <div
          aria-hidden
          style={{ position: "fixed", top: 0, left: "-9999px", width: "794px", pointerEvents: "none", zIndex: -1 }}
        >
          <div ref={exportRef} style={{ fontFamily: "Arial, sans-serif", padding: "48px", background: "#fff", color: "#0f172a" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", paddingBottom: "20px", borderBottom: "2px solid #0f172a" }}>
              <div>
                <div style={{ fontSize: "22px", fontWeight: 700, color: "#1d4ed8" }}>Orcafrio</div>
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>Orçamento Inteligente</div>
                {tecnico.nome && <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "8px" }}>{tecnico.nome}</div>}
                {tecnico.endereco && <div style={{ fontSize: "11px", color: "#334155" }}>{tecnico.endereco}</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "16px", fontWeight: 700 }}>Histórico de Orçamentos</div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#1d4ed8", marginTop: "4px" }}>{cliente.nome}</div>
                {cliente.telefone && <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>{cliente.telefone}</div>}
                {cliente.endereco && <div style={{ fontSize: "11px", color: "#64748b" }}>{cliente.endereco}</div>}
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Gerado em: {formatDate(new Date().toISOString())}</div>
              </div>
            </div>

            {/* Stats summary */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "28px" }}>
              {[
                { label: "Total de Orçamentos", value: String(orcamentos.length), color: "#0f172a" },
                { label: "Aprovados", value: String(qtdAprovados), color: "#16a34a" },
                { label: "Valor Total", value: formatCurrency(totalGeral), color: "#1d4ed8" },
              ].map(stat => (
                <div key={stat.label} style={{ flex: 1, padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#f8fafc" }}>
                  <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: stat.color, marginTop: "4px" }}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#0f172a", color: "#fff" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600 }}>Número</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600 }}>Data</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {orcamentos.map((orc, i) => {
                  const statusColors: Record<string, string> = {
                    aprovado: "#16a34a", recusado: "#dc2626", enviado: "#2563eb",
                    rascunho: "#6b7280", cancelado: "#9ca3af",
                  };
                  return (
                    <tr key={orc.id} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>{orc.numero}</td>
                      <td style={{ padding: "10px 12px", color: "#334155" }}>{formatDate(orc.createdAt)}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ color: statusColors[orc.status] ?? "#6b7280", fontWeight: 600, textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.05em" }}>
                          {getStatusLabel(orc.status)}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>{formatCurrency(orc.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f1f5f9", borderTop: "2px solid #0f172a" }}>
                  <td colSpan={3} style={{ padding: "12px", fontWeight: 700, textAlign: "right" }}>TOTAL GERAL</td>
                  <td style={{ padding: "12px", fontWeight: 800, fontSize: "14px", textAlign: "right", color: "#1d4ed8" }}>{formatCurrency(totalGeral)}</td>
                </tr>
              </tfoot>
            </table>

            {/* Footer */}
            <div style={{ marginTop: "32px", paddingTop: "12px", borderTop: "1px solid #e2e8f0", textAlign: "center", fontSize: "10px", color: "#94a3b8" }}>
              Documento gerado pelo sistema Orcafrio · Orçamento Inteligente
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
