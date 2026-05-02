import { Link } from "wouter";
import { FileText, Share2, Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <img src="/logo.jpg" alt="Orcafrio" className="h-9 w-9 rounded-lg object-cover" />
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-primary text-lg">Orcafrio</span>
            <span className="text-[10px] text-muted-foreground -mt-0.5">Orçamento Inteligente</span>
          </div>
        </div>
        <Link href="/sign-in">
          <Button variant="outline" size="sm">Entrar</Button>
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center max-w-lg mx-auto w-full">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <CheckCircle className="h-3.5 w-3.5" />
          30 dias grátis · Sem cartão de crédito
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-4 leading-tight">
          Orçamentos Profissionais para Técnicos de Refrigeração
        </h1>

        <p className="text-gray-500 text-base mb-8 leading-relaxed">
          Crie orçamentos, gere PDF com sua assinatura e envie direto pelo WhatsApp — tudo em segundos, no celular ou computador.
        </p>

        <Link href="/sign-up">
          <Button size="lg" className="w-full text-base font-semibold mb-3 h-12">
            Criar conta grátis
          </Button>
        </Link>
        <p className="text-xs text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/sign-in" className="text-primary font-medium underline underline-offset-2">
            Entrar
          </Link>
        </p>
      </main>

      {/* Features */}
      <section className="bg-gray-50 px-6 py-12">
        <div className="max-w-lg mx-auto space-y-4">
          <h2 className="text-center text-lg font-bold text-gray-800 mb-6">
            Tudo que você precisa no dia a dia
          </h2>
          {[
            {
              icon: FileText,
              color: "text-blue-600",
              bg: "bg-blue-50",
              title: "PDF Profissional",
              desc: "Gere PDFs com logo, seus dados e assinatura. Pronto para enviar ao cliente.",
            },
            {
              icon: Share2,
              color: "text-green-600",
              bg: "bg-green-50",
              title: "Envio via WhatsApp",
              desc: "Compartilhe o PDF diretamente no WhatsApp do cliente com um toque.",
            },
            {
              icon: Sparkles,
              color: "text-purple-600",
              bg: "bg-purple-50",
              title: "Sugestão de Preços por IA",
              desc: "A IA sugere preços de mercado para cada serviço com base na sua região.",
            },
          ].map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="flex items-start gap-4 bg-white rounded-xl p-4 shadow-sm border">
              <div className={`p-2.5 rounded-lg ${bg} shrink-0`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{title}</p>
                <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-muted-foreground border-t">
        © {new Date().getFullYear()} Orcafrio · Orçamento Inteligente
      </footer>
    </div>
  );
}
