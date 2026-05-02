import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Privacidade() {
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
          <h1 className="text-2xl sm:text-3xl font-bold">Política de Privacidade</h1>
          <p className="text-sm text-muted-foreground">Última atualização: {dataAtualizacao}</p>
        </div>
      </div>

      <Card>
        <CardContent className="prose prose-sm max-w-none p-6 space-y-5 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Quem somos</h2>
            <p>
              O <strong>Orcafrio</strong> é um aplicativo voltado a profissionais e empresas de refrigeração e
              climatização, que permite a criação e o gerenciamento de orçamentos de serviços. Esta Política
              de Privacidade descreve como tratamos os dados utilizados no Aplicativo, em conformidade com a
              Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. Dados que coletamos</h2>
            <p>
              O Aplicativo armazena exclusivamente os dados que <strong>você</strong>, profissional usuário,
              insere voluntariamente, a saber:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Dados de seus clientes (nome, telefone, e-mail, endereço, CPF/CNPJ)</li>
              <li>Conteúdo dos orçamentos (descrições de serviço, quantidades, valores, observações)</li>
              <li>Endereço do técnico (armazenado localmente no navegador para facilitar cálculos de deslocamento)</li>
            </ul>
            <p>
              Atualmente, o Aplicativo não exige cadastro com login, e portanto <strong>não coletamos dados
              pessoais do próprio usuário-profissional</strong> além daqueles que ele opta por digitar.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">3. Finalidade do tratamento</h2>
            <p>Os dados são utilizados exclusivamente para:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Gerar e armazenar os orçamentos do usuário</li>
              <li>Permitir o compartilhamento com clientes (ex.: via WhatsApp ou versão para impressão/PDF)</li>
              <li>Calcular sugestões de preço e taxa de deslocamento via inteligência artificial</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Compartilhamento com terceiros</h2>
            <p>Para entregar a funcionalidade de sugestões inteligentes, enviamos:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Para a OpenAI</strong>: descrição do serviço, categoria, e endereços (técnico e
                cliente) quando o usuário aciona os botões "Sugerir IA". Estes dados trafegam de forma
                segura e são processados conforme a política de privacidade da OpenAI.
              </li>
            </ul>
            <p>
              <strong>Não vendemos, alugamos ou cedemos</strong> seus dados ou os de seus clientes para fins
              de marketing de terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Base legal (LGPD)</h2>
            <p>
              O tratamento de dados é realizado com base no <strong>legítimo interesse</strong> do
              profissional usuário em gerir sua atividade comercial e na <strong>execução do
              contrato</strong> de uso do serviço, conforme art. 7º da LGPD.
            </p>
            <p>
              Quando o usuário insere dados de seus próprios clientes, ele atua como
              <strong> controlador</strong> desses dados perante a LGPD, sendo responsável pelas bases legais
              e pelo cumprimento dos direitos dos titulares.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">6. Armazenamento e segurança</h2>
            <p>
              Os dados ficam armazenados em banco de dados PostgreSQL hospedado em infraestrutura de nuvem
              com criptografia em trânsito (TLS/HTTPS). O endereço do técnico é guardado apenas no
              navegador do próprio usuário (localStorage), nunca enviado a terceiros sem solicitação.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">7. Direitos dos titulares</h2>
            <p>Nos termos da LGPD, qualquer titular de dados pode solicitar:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Confirmação da existência de tratamento</li>
              <li>Acesso aos dados</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos</li>
              <li>Portabilidade ou eliminação dos dados pessoais tratados com seu consentimento</li>
            </ul>
            <p>
              Para exercer estes direitos, entre em contato pelo canal de suporte informado no Aplicativo.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">8. Retenção</h2>
            <p>
              Os dados permanecem armazenados enquanto o usuário fizer uso do Aplicativo. A exclusão pode ser
              solicitada a qualquer momento, e os dados serão removidos em até 30 dias, ressalvadas as
              hipóteses de guarda legal obrigatória.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">9. Cookies</h2>
            <p>
              O Aplicativo não utiliza cookies de rastreamento de terceiros. Utilizamos apenas
              armazenamento local do navegador (localStorage) para preferências do próprio usuário, como o
              endereço de origem para cálculos de deslocamento.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">10. Alterações nesta Política</h2>
            <p>
              Esta Política pode ser atualizada periodicamente. A versão vigente estará sempre disponível
              nesta página, com a data da última atualização indicada no topo.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">11. Contato</h2>
            <p>
              Dúvidas, solicitações ou reclamações sobre privacidade podem ser encaminhadas pelo canal de
              suporte do Aplicativo.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
