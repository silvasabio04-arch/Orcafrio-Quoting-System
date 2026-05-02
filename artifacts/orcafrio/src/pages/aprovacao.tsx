import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { CheckCircle, XCircle, Loader2, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";

const CATEGORIA_LABELS: Record<string, string> = {
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

interface OrcamentoPublico {
  numero: string;
  total: number;
  prazoExecucao?: string | null;
  validadeOrcamento?: string | null;
  garantia?: string | null;
  condicoesPagamento?: string | null;
  observacoes?: string | null;
  equipamentoTipo?: string | null;
  equipamentoModelo?: string | null;
  equipamentoCapacidade?: string | null;
  respostaCliente?: string | null;
  cliente?: { nome: string } | null;
  itens: { id: number; categoria: string; descricao: string; quantidade: number; precoUnitario: number; subtotal: number }[];
}

export default function Aprovacao() {
  const { token } = useParams();
  const [orcamento, setOrcamento] = useState<OrcamentoPublico | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [respondido, setRespondido] = useState<"aprovado" | "recusado" | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/aprovacao/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setOrcamento(data);
        if (data.respostaCliente) setRespondido(data.respostaCliente);
      })
      .catch(() => setErro("Orçamento não encontrado ou link inválido."))
      .finally(() => setLoading(false));
  }, [token]);

  const responder = async (resposta: "aprovado" | "recusado") => {
    if (!token) return;
    setEnviando(true);
    try {
      const r = await fetch(`/api/aprovacao/${token}/resposta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resposta, comentario: comentario.trim() || undefined }),
      });
      if (r.status === 409) {
        setRespondido(orcamento?.respostaCliente as any ?? resposta);
        return;
      }
      if (!r.ok) throw new Error();
      setRespondido(resposta);
    } catch {
      alert("Erro ao enviar resposta. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  if (erro) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center">
        <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800">{erro}</h2>
      </div>
    </div>
  );

  if (!orcamento) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-5">

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <img src="/logo.jpg" alt="Orcafrio" className="h-8 w-8 rounded-md object-cover" />
            <span className="font-bold text-blue-700 text-lg">Orcafrio</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-3">Orçamento {orcamento.numero}</h1>
          {orcamento.cliente && (
            <p className="text-slate-500 mt-1">Para: <strong>{orcamento.cliente.nome}</strong></p>
          )}
        </div>

        {(orcamento.equipamentoTipo || orcamento.equipamentoModelo || orcamento.equipamentoCapacidade) && (
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Equipamento</p>
              <div className="flex flex-wrap gap-3 text-sm">
                {orcamento.equipamentoTipo && <span><strong>Tipo:</strong> {orcamento.equipamentoTipo}</span>}
                {orcamento.equipamentoModelo && <span><strong>Modelo:</strong> {orcamento.equipamentoModelo}</span>}
                {orcamento.equipamentoCapacidade && <span><strong>Capacidade:</strong> {orcamento.equipamentoCapacidade}</span>}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Itens do Serviço</p>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {orcamento.itens.map(item => (
              <div key={item.id} className="flex justify-between items-start gap-2 py-2 border-b last:border-0">
                <div className="flex-1">
                  <p className="font-medium text-sm text-slate-800">{item.descricao}</p>
                  <p className="text-xs text-slate-500">{CATEGORIA_LABELS[item.categoria] ?? item.categoria} · Qtd: {item.quantidade}</p>
                </div>
                <p className="font-semibold text-sm text-slate-800 shrink-0">{formatCurrency(item.subtotal)}</p>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3">
              <span className="font-bold text-slate-700">TOTAL</span>
              <span className="text-2xl font-bold text-blue-700">{formatCurrency(orcamento.total)}</span>
            </div>
          </CardContent>
        </Card>

        {(orcamento.prazoExecucao || orcamento.validadeOrcamento || orcamento.garantia || orcamento.condicoesPagamento) && (
          <Card>
            <CardContent className="pt-4 pb-4 px-4 grid grid-cols-2 gap-3 text-sm">
              {orcamento.prazoExecucao && (
                <div><p className="text-xs text-slate-500">Prazo</p><p className="font-medium">{orcamento.prazoExecucao}</p></div>
              )}
              {orcamento.validadeOrcamento && (
                <div><p className="text-xs text-slate-500">Validade</p><p className="font-medium">{orcamento.validadeOrcamento}</p></div>
              )}
              {orcamento.garantia && (
                <div><p className="text-xs text-slate-500">Garantia</p><p className="font-medium">{orcamento.garantia}</p></div>
              )}
              {orcamento.condicoesPagamento && (
                <div><p className="text-xs text-slate-500">Pagamento</p><p className="font-medium">{orcamento.condicoesPagamento}</p></div>
              )}
            </CardContent>
          </Card>
        )}

        {orcamento.observacoes && (
          <Card>
            <CardContent className="pt-4 pb-4 px-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Observações</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{orcamento.observacoes}</p>
            </CardContent>
          </Card>
        )}

        {respondido ? (
          <div className={`rounded-xl p-6 text-center ${respondido === "aprovado" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            {respondido === "aprovado" ? (
              <>
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-green-800">Serviço Autorizado!</h2>
                <p className="text-green-700 mt-1 text-sm">Sua resposta foi registrada. O técnico foi notificado.</p>
              </>
            ) : (
              <>
                <XCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-red-800">Serviço Não Autorizado</h2>
                <p className="text-red-700 mt-1 text-sm">Sua resposta foi registrada. O técnico foi notificado.</p>
              </>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-5 pb-5 px-4 space-y-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sua resposta (opcional)</p>
              <Textarea
                placeholder="Deixe um comentário para o técnico..."
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                rows={3}
                className="text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white h-14 text-base font-bold"
                  onClick={() => responder("aprovado")}
                  disabled={enviando}
                >
                  {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ThumbsUp className="mr-2 h-5 w-5" />Autorizar</>}
                </Button>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 h-14 text-base font-bold"
                  onClick={() => responder("recusado")}
                  disabled={enviando}
                >
                  {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ThumbsDown className="mr-2 h-5 w-5" />Não Autorizar</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-slate-400 pb-4">Orcafrio · Orçamento Inteligente</p>
      </div>
    </div>
  );
}
