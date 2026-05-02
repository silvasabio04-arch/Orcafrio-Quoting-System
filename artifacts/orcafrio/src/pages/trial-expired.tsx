import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClerk } from "@clerk/react";

export default function TrialExpired() {
  const { signOut } = useClerk();

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
            Seus 30 dias gratuitos chegaram ao fim. Em breve você poderá assinar para continuar usando o Orcafrio.
          </p>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 text-left space-y-1.5">
          <p className="text-sm font-semibold text-blue-800">O que está incluso:</p>
          {[
            "Orçamentos ilimitados",
            "PDF com assinatura digital",
            "Envio via WhatsApp",
            "Sugestão de preços por IA",
            "Gestão de clientes",
          ].map((item) => (
            <p key={item} className="text-xs text-blue-700 flex items-center gap-1.5">
              <span className="text-blue-500">✓</span> {item}
            </p>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Planos em breve. Entre em contato via WhatsApp para mais informações.
        </p>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => signOut({ redirectUrl: "/" })}
        >
          Sair da conta
        </Button>
      </div>
    </div>
  );
}
