import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Termos() {
  const dataAtualizacao = "02 de maio de 2026";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button size="icon" variant="outline">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Termos de Uso</h1>
          <p className="text-sm text-muted-foreground">Última atualização: {dataAtualizacao}</p>
        </div>
      </div>

      <Card>
        <CardContent className="prose prose-sm max-w-none p-6 space-y-5 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e utilizar o aplicativo <strong>Orcafrio</strong> ("Aplicativo"), você concorda com
              estes Termos de Uso. Caso não concorde, recomendamos não utilizar o serviço.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. Descrição do Serviço</h2>
            <p>
              O Orcafrio é uma ferramenta para profissionais autônomos e empresas do setor de refrigeração e
              climatização gerarem, gerenciarem e compartilharem orçamentos de serviços com seus clientes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">3. Cadastro e Responsabilidade do Usuário</h2>
            <p>
              Você é o único responsável pelas informações cadastradas no Aplicativo, incluindo dados de
              clientes, valores praticados, descrições de serviços e demais conteúdos.
            </p>
            <p>
              É proibido utilizar o Aplicativo para fins ilícitos, fraudulentos ou que violem direitos de
              terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Sugestões de Preço por Inteligência Artificial</h2>
            <p>
              O Aplicativo oferece sugestões de preço de serviços e taxas de deslocamento geradas por modelos
              de inteligência artificial. <strong>Estas sugestões são meramente estimativas</strong> baseadas
              em dados gerais de mercado e <strong>não constituem aconselhamento profissional</strong>. O
              valor final cobrado é de exclusiva responsabilidade do usuário, que deve avaliar custos reais,
              margem de lucro, condições do serviço e regulamentações locais.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Propriedade Intelectual</h2>
            <p>
              O nome, logotipo, design, código-fonte e demais elementos do Aplicativo são de propriedade
              exclusiva do Orcafrio. Os dados inseridos pelo usuário (clientes, orçamentos) permanecem de
              propriedade do próprio usuário.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">6. Limitação de Responsabilidade</h2>
            <p>
              O Aplicativo é fornecido "como está", sem garantias de disponibilidade ininterrupta ou ausência
              de erros. O Orcafrio não se responsabiliza por perdas, lucros cessantes ou danos diretos ou
              indiretos decorrentes do uso ou da impossibilidade de uso do serviço.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">7. Modificações</h2>
            <p>
              Estes Termos podem ser atualizados a qualquer momento. A versão vigente estará sempre
              disponível nesta página, com a data da última atualização indicada no topo.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">8. Lei Aplicável</h2>
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da
              comarca de domicílio do usuário para dirimir quaisquer controvérsias.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">9. Contato</h2>
            <p>
              Em caso de dúvidas sobre estes Termos, entre em contato pelo e-mail de suporte informado dentro
              do Aplicativo.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
