import { useParams, Link, useLocation } from "wouter";
import { useGetOrcamento, useUpdateOrcamentoStatus, useDeleteOrcamento, getGetOrcamentoQueryKey, getListOrcamentosQueryKey, getGetDashboardResumoQueryKey, getGetOrcamentosRecentesQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, FileText, Share2, Printer, X, Ban, Clock, User, CheckCircle, Edit, Trash2, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { getStatusColor, getStatusLabel } from "@/pages/dashboard";
import { UpdateStatusBodyStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useRef, useState } from "react";
import { OrcamentoPdf } from "@/components/orcamento-pdf";
import { useTecnicoProfile } from "@/lib/tecnico";

export default function OrcamentoDetalhes() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const tecnico = useTecnicoProfile();
  const pdfRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const { data: orcamento, isLoading } = useGetOrcamento(Number(id), {
    query: { enabled: !!id, queryKey: getGetOrcamentoQueryKey(Number(id)) }
  });

  const updateStatus = useUpdateOrcamentoStatus();
  const deleteOrcamento = useDeleteOrcamento();

  const handleUpdateStatus = (newStatus: UpdateStatusBodyStatus) => {
    updateStatus.mutate(
      { id: Number(id), data: { status: newStatus } },
      {
        onSuccess: () => {
          toast({ title: `Status atualizado para ${getStatusLabel(newStatus)}` });
          queryClient.invalidateQueries({ queryKey: getGetOrcamentoQueryKey(Number(id)) });
          queryClient.invalidateQueries({ queryKey: getListOrcamentosQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardResumoQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetOrcamentosRecentesQueryKey() });
        },
        onError: () => {
          toast({ title: "Erro ao atualizar status", variant: "destructive" });
        }
      }
    );
  };

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.")) {
      deleteOrcamento.mutate(
        { id: Number(id) },
        {
          onSuccess: () => {
            toast({ title: "Orçamento excluído com sucesso" });
            queryClient.invalidateQueries({ queryKey: getListOrcamentosQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetDashboardResumoQueryKey() });
            setLocation("/orcamentos");
          },
          onError: () => {
            toast({ title: "Erro ao excluir orçamento", variant: "destructive" });
          },
        }
      );
    }
  };

  const buildWhatsAppText = () => {
    if (!orcamento || !orcamento.cliente) return "";
    let text = `*Orçamento ${orcamento.numero}*\n\n`;
    text += `Olá ${orcamento.cliente.nome},\n\n`;
    text += `Segue o resumo do seu orçamento:\n\n`;
    orcamento.itens.forEach(item => {
      text += `• ${item.quantidade}x ${item.descricao} — ${formatCurrency(item.subtotal)}\n`;
    });
    text += `\n*Total: ${formatCurrency(orcamento.total)}*\n`;
    if (orcamento.prazoExecucao) text += `\nPrazo: ${orcamento.prazoExecucao}`;
    if (orcamento.condicoesPagamento) text += `\nPagamento: ${orcamento.condicoesPagamento}`;
    if (tecnico.nome) text += `\n\nAtenciosamente,\n${tecnico.nome}`;
    else text += `\n\nFico à disposição para dúvidas.`;
    return text;
  };

  const generatePdfBlob = async (): Promise<Blob> => {
    const html2pdf = (await import("html2pdf.js")).default;
    const el = pdfRef.current;
    if (!el) throw new Error("PDF element not ready");
    return html2pdf()
      .set({
        margin: 0,
        filename: `Orcamento-${orcamento?.numero ?? id}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(el)
      .output("blob") as Promise<Blob>;
  };

  const handleDownloadPdf = async () => {
    if (!orcamento) return;
    setGenerating(true);
    try {
      const blob = await generatePdfBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Orcamento-${orcamento.numero}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Erro ao gerar PDF", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!orcamento || !orcamento.cliente) return;
    setGenerating(true);
    const text = buildWhatsAppText();
    const phone = orcamento.cliente.telefone.replace(/\D/g, "");
    try {
      const blob = await generatePdfBlob();
      const file = new File([blob], `Orcamento-${orcamento.numero}.pdf`, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Orçamento ${orcamento.numero}`,
          text,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
        setTimeout(() => {
          window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(text)}`, "_blank");
        }, 800);
      }

      if (orcamento.status === "rascunho") handleUpdateStatus("enviado");
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(text)}`, "_blank");
      }
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => window.print();

  const getCategoriaLabel = (cat: string) => {
    const map: Record<string, string> = {
      manutencao_preventiva: "Manutenção Preventiva",
      higienizacao: "Higienização",
      instalacao: "Instalação",
      troca_compressor: "Troca de Compressor",
      carga_gas: "Carga de Gás",
      diagnostico: "Diagnóstico",
      conserto: "Conserto",
      mao_de_obra: "Mão de Obra",
      outros: "Outros",
    };
    return map[cat] || cat;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!orcamento) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Orçamento não encontrado</h2>
        <Link href="/orcamentos">
          <Button className="mt-4">Voltar para Orçamentos</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Hidden PDF document rendered off-screen for html2pdf capture */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: "-9999px",
          width: "794px",
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        <OrcamentoPdf
          ref={pdfRef}
          orcamento={orcamento}
          tecnico={tecnico}
          aprovacaoUrl={orcamento.aprovacaoToken ? `${window.location.origin}/aprovacao/${orcamento.aprovacaoToken}` : undefined}
        />
      </div>

      <div className="space-y-6 pb-24 print:pb-0">
        {/* Header / Actions - Hidden in print */}
        <div className="flex flex-col gap-4 items-start print:hidden">
          <div className="flex items-center gap-4">
            <Link href="/orcamentos">
              <Button variant="outline" size="icon" className="shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{orcamento.numero}</h1>
                <Badge variant="outline" className={`border-0 ${getStatusColor(orcamento.status)}`}>
                  {getStatusLabel(orcamento.status)}
                </Badge>
              </div>
              <p className="text-muted-foreground">Criado em {formatDate(orcamento.createdAt)}</p>
            </div>
          </div>

          {/* Action buttons row */}
          <div className="flex flex-wrap items-center gap-2 w-full">
            <Link href={`/orcamentos/${orcamento.id}/editar`}>
              <Button variant="outline" size="icon" title="Editar">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="icon"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={handleDelete}
              title="Excluir"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handlePrint} title="Imprimir">
              <Printer className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDownloadPdf}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Baixar PDF
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleShare}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="mr-2 h-4 w-4" />
              )}
              WhatsApp
            </Button>
          </div>
        </div>

        {/* Status Actions - Hidden in print */}
        <div className="flex flex-wrap gap-2 print:hidden">
          {orcamento.status !== "aprovado" && (
            <Button
              variant="outline"
              size="sm"
              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
              onClick={() => handleUpdateStatus("aprovado")}
            >
              <CheckCircle className="mr-1 h-4 w-4" /> Aprovar
            </Button>
          )}
          {orcamento.status !== "recusado" && (
            <Button
              variant="outline"
              size="sm"
              className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
              onClick={() => handleUpdateStatus("recusado")}
            >
              <X className="mr-1 h-4 w-4" /> Recusar
            </Button>
          )}
          {orcamento.status !== "cancelado" && (
            <Button
              variant="outline"
              size="sm"
              className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
              onClick={() => handleUpdateStatus("cancelado")}
            >
              <Ban className="mr-1 h-4 w-4" /> Cancelar
            </Button>
          )}
        </div>

        {/* Print Header */}
        <div className="hidden print:block mb-8 border-b pb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo.jpg" alt="Orcafrio" className="h-14 w-14 rounded-lg object-cover" />
              <div>
                <h1 className="text-3xl font-bold text-primary">ORCAFRIO</h1>
                <p className="text-sm text-gray-500 mt-1">Orçamento Inteligente</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold">{orcamento.numero}</h2>
              <p className="text-sm text-gray-500">Data: {formatDate(orcamento.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 print:lg:grid-cols-3">
          {/* Left: Customer & Conditions */}
          <div className="space-y-6 print:lg:col-span-1">
            {orcamento.cliente && (
              <Card className="print:border-0 print:shadow-none print:p-0">
                <CardHeader className="print:px-0 print:pt-0">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 print:px-0">
                  <div>
                    <p className="font-semibold text-lg">{orcamento.cliente.nome}</p>
                    {orcamento.cliente.cpfCnpj && (
                      <p className="text-sm text-muted-foreground">{orcamento.cliente.cpfCnpj}</p>
                    )}
                  </div>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">Telefone:</span> {orcamento.cliente.telefone}</p>
                    {orcamento.cliente.email && (
                      <p><span className="font-medium">E-mail:</span> {orcamento.cliente.email}</p>
                    )}
                    {orcamento.cliente.endereco && (
                      <p><span className="font-medium">Endereço:</span> {orcamento.cliente.endereco}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="print:border-0 print:shadow-none print:p-0">
              <CardHeader className="print:px-0">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  Condições
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm print:px-0">
                {orcamento.prazoExecucao && (
                  <div>
                    <p className="font-medium text-muted-foreground">Prazo de Execução</p>
                    <p>{orcamento.prazoExecucao}</p>
                  </div>
                )}
                {orcamento.validadeOrcamento && (
                  <div>
                    <p className="font-medium text-muted-foreground">Validade</p>
                    <p>{orcamento.validadeOrcamento}</p>
                  </div>
                )}
                {orcamento.garantia && (
                  <div>
                    <p className="font-medium text-muted-foreground">Garantia</p>
                    <p>{orcamento.garantia}</p>
                  </div>
                )}
                {orcamento.condicoesPagamento && (
                  <div>
                    <p className="font-medium text-muted-foreground">Condições de Pagamento</p>
                    <p>{orcamento.condicoesPagamento}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Items & Total */}
          <div className="space-y-6 print:lg:col-span-2">
            <Card className="print:border-0 print:shadow-none print:p-0">
              <CardHeader className="print:px-0">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  Itens do Serviço
                </CardTitle>
              </CardHeader>
              <CardContent className="print:px-0">
                <div className="rounded-md border print:border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50 print:bg-gray-100">
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">V. Unit.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orcamento.itens.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <p className="font-medium">{item.descricao}</p>
                            <p className="text-xs text-muted-foreground">{getCategoriaLabel(item.categoria)}</p>
                          </TableCell>
                          <TableCell className="text-right">{item.quantidade}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.precoUnitario)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(item.subtotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="flex-col items-end border-t pt-6 pb-6 bg-muted/20 print:bg-transparent print:border-t-2 print:border-gray-800">
                <div className="flex justify-between w-full mb-2">
                  <span className="text-muted-foreground font-medium">Subtotal Itens:</span>
                  <span>{formatCurrency(orcamento.total)}</span>
                </div>
                <div className="flex justify-between w-full text-xl font-bold mt-2 pt-2 border-t border-dashed">
                  <span className="text-primary">TOTAL:</span>
                  <span className="text-primary">{formatCurrency(orcamento.total)}</span>
                </div>
              </CardFooter>
            </Card>

            {orcamento.observacoes && (
              <Card className="print:border-0 print:shadow-none print:p-0">
                <CardHeader className="print:px-0">
                  <CardTitle className="text-lg">Observações</CardTitle>
                </CardHeader>
                <CardContent className="print:px-0">
                  <p className="text-sm whitespace-pre-wrap bg-muted/30 p-4 rounded-md print:bg-transparent print:p-0 print:border-l-4 print:border-gray-300 print:pl-4">
                    {orcamento.observacoes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Signature footer — visible in print only */}
        {(tecnico.nome || tecnico.assinatura) && (
          <div className="hidden print:block mt-16 pt-8 border-t">
            <div className="flex justify-end">
              <div className="text-center w-64">
                {tecnico.assinatura && (
                  <img
                    src={tecnico.assinatura}
                    alt="Assinatura"
                    className="h-20 mx-auto object-contain"
                  />
                )}
                <div className="border-t border-gray-800 mt-1 pt-2">
                  <p className="font-semibold text-sm">{tecnico.nome || "Técnico Responsável"}</p>
                  {tecnico.endereco && (
                    <p className="text-xs text-gray-500 mt-1">{tecnico.endereco}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Print Footer */}
        <div className="hidden print:block mt-8 text-center text-xs text-gray-400">
          <p>Documento gerado pelo sistema Orcafrio · Orçamento Inteligente</p>
        </div>
      </div>
    </>
  );
}
