import { useState, useEffect } from "react";
import { Lock, Sparkles, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClerk } from "@clerk/react";
import { useLocation } from "wouter";

export default function TrialExpired() {
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();
  const [checkoutUrl, setCheckoutUrl] = useState<string>("");
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    fetch("/api/payment/checkout-url", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setCheckoutUrl(d.url ?? ""))
      .catch(() => {});
  }, []);

  async function verificarPagamento() {
    setChecking(true);
    setMessage("");
    try {
      const res = await fetch("/api/users/me", { credentials: "include" });
      if (res.status === 402) {
        setMessage("Pagamento ainda não identificado. Aguarde alguns instantes e tente novamente.");
        return;
      }
      const data = await res.json();
      if (data.isPaid) {
        setLocation("/inicio");
      } else {
        setMessage("Pagamento ainda não identificado. Aguarde alguns instantes e tente novamente.");
      }
    } catch {
      setMessage("Erro ao verificar. Tente novamente.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 px-6 text-center">
      <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-sm w-full space-y-5">
        <div className="flex justify-center">
          <div className="bg-orange-100 rounded-full p-4">
            <Lock className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold text-gray-900">Período de Teste Encerrado</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Seus 30 dias gratuitos chegaram ao fim. Adquira o acesso vitalício por apenas <strong className="text-gray-800">R$&nbsp;19,99</strong> — pagamento único, sem mensalidade.
          </p>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 text-left space-y-1.5">
          <p className="text-sm font-semibold text-blue-800">Tudo incluso no acesso vitalício:</p>
          {[
            "Orçamentos ilimitados",
            "PDF com assinatura digital",
            "Envio via WhatsApp",
            "Sugestão de preços por IA",
            "Gestão de clientes",
            "Todas as atualizações futuras",
          ].map((item) => (
            <p key={item} className="text-xs text-blue-700 flex items-center gap-1.5">
              <span className="text-blue-500">✓</span> {item}
            </p>
          ))}
        </div>

        {checkoutUrl ? (
          <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="block">
            <Button className="w-full font-semibold gap-2 bg-green-600 hover:bg-green-700 text-white h-11">
              <Sparkles className="h-4 w-4" />
              Comprar Acesso Vitalício — R$&nbsp;19,99
              <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-70" />
            </Button>
          </a>
        ) : (
          <Button className="w-full font-semibold bg-green-600 hover:bg-green-700 text-white h-11" disabled>
            Carregando link de pagamento…
          </Button>
        )}

        <button
          onClick={verificarPagamento}
          disabled={checking}
          className="w-full flex items-center justify-center gap-2 text-sm text-primary font-medium py-2 hover:underline disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
          {checking ? "Verificando…" : "Já paguei — verificar acesso"}
        </button>

        {message && (
          <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">{message}</p>
        )}

        <button
          onClick={() => signOut({ redirectUrl: "/" })}
          className="w-full text-xs text-muted-foreground hover:text-foreground pt-1"
        >
          Sair da conta
        </button>
      </div>
    </div>
  );
}
