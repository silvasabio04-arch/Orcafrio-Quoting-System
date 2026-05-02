import { useEffect, useState } from "react";
import { Link } from "wouter";
import { CheckCircle, XCircle, Bell, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

interface Notificacao {
  id: number;
  numero: string;
  clienteNome: string;
  respostaCliente: string;
  comentarioCliente?: string | null;
  respostaAt: string;
  respostaLida: boolean;
}

export default function Notificacoes() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notificacoes")
      .then(r => r.json())
      .then(data => setNotificacoes(data))
      .finally(() => setLoading(false));

    fetch("/api/notificacoes/marcar-lidas", { method: "POST" }).catch(() => {});
  }, []);

  return (
    <div className="space-y-5 pb-24">
      <div className="flex items-center gap-4">
        <Link href="/inicio">
          <Button variant="outline" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6" /> Respostas dos Clientes
          </h1>
          <p className="text-muted-foreground text-sm">Orçamentos aprovados ou recusados pelos clientes</p>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />)}
        </div>
      )}

      {!loading && notificacoes.length === 0 && (
        <div className="text-center py-16">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <p className="text-muted-foreground">Nenhuma resposta ainda.</p>
          <p className="text-sm text-muted-foreground mt-1">As respostas dos clientes aparecerão aqui.</p>
        </div>
      )}

      <div className="space-y-3">
        {notificacoes.map(n => (
          <Link key={n.id} href={`/orcamentos/${n.id}`}>
            <Card className={`cursor-pointer hover:shadow-md transition-shadow ${!n.respostaLida ? "border-blue-300 bg-blue-50/30" : ""}`}>
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-start gap-3">
                  {n.respostaCliente === "aprovado" ? (
                    <CheckCircle className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm">
                        {n.respostaCliente === "aprovado" ? "✅ Autorizado" : "❌ Não Autorizado"}
                        <span className="font-normal text-muted-foreground ml-1">· {n.numero}</span>
                      </p>
                      {!n.respostaLida && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{n.clienteNome}</p>
                    {n.comentarioCliente && (
                      <p className="text-xs text-slate-600 mt-1 italic">"{n.comentarioCliente}"</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(n.respostaAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
