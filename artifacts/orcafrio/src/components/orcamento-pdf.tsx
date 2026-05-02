import { forwardRef } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { getStatusLabel } from "@/pages/dashboard";
import type { TecnicoProfile } from "@/lib/tecnico";

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

interface Cliente {
  nome: string;
  telefone: string;
  email?: string | null;
  endereco?: string | null;
  cpfCnpj?: string | null;
}

interface Item {
  id: number;
  categoria: string;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

interface OrcamentoPdfData {
  numero: string;
  status: string;
  createdAt: string;
  total: number;
  prazoExecucao?: string | null;
  validadeOrcamento?: string | null;
  garantia?: string | null;
  condicoesPagamento?: string | null;
  observacoes?: string | null;
  equipamentoTipo?: string | null;
  equipamentoModelo?: string | null;
  equipamentoCapacidade?: string | null;
  cliente?: Cliente | null;
  itens: Item[];
}

interface OrcamentoPdfProps {
  orcamento: OrcamentoPdfData;
  tecnico: TecnicoProfile;
}

export const OrcamentoPdf = forwardRef<HTMLDivElement, OrcamentoPdfProps>(
  ({ orcamento, tecnico }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          width: "794px",
          padding: "40px",
          backgroundColor: "#ffffff",
          color: "#0f172a",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          fontSize: "12px",
          lineHeight: 1.5,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "16px",
            borderBottom: "2px solid #1d4ed8",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <img
              src="/logo.jpg"
              alt="Orcafrio"
              crossOrigin="anonymous"
              style={{ width: "56px", height: "56px", borderRadius: "8px", objectFit: "cover" }}
            />
            <div>
              <div style={{ fontSize: "26px", fontWeight: 800, color: "#1d4ed8", letterSpacing: "0.5px" }}>
                ORCAFRIO
              </div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                Orçamento Inteligente
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "20px", fontWeight: 700 }}>{orcamento.numero}</div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
              Emitido em {formatDate(orcamento.createdAt)}
            </div>
            <div
              style={{
                display: "inline-block",
                marginTop: "6px",
                padding: "2px 10px",
                fontSize: "10px",
                fontWeight: 600,
                borderRadius: "999px",
                backgroundColor: "#eff6ff",
                color: "#1d4ed8",
                border: "1px solid #bfdbfe",
              }}
            >
              {getStatusLabel(orcamento.status)}
            </div>
          </div>
        </div>

        {orcamento.cliente && (
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "6px",
              }}
            >
              Cliente
            </div>
            <div style={{ fontSize: "16px", fontWeight: 700 }}>{orcamento.cliente.nome}</div>
            {orcamento.cliente.cpfCnpj && (
              <div style={{ fontSize: "11px", color: "#64748b" }}>{orcamento.cliente.cpfCnpj}</div>
            )}
            <div style={{ marginTop: "6px", fontSize: "12px" }}>
              <div>
                <strong>Telefone:</strong> {orcamento.cliente.telefone}
              </div>
              {orcamento.cliente.email && (
                <div>
                  <strong>E-mail:</strong> {orcamento.cliente.email}
                </div>
              )}
              {orcamento.cliente.endereco && (
                <div>
                  <strong>Endereço:</strong> {orcamento.cliente.endereco}
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "8px",
            }}
          >
            Itens do Serviço
          </div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "11px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f1f5f9" }}>
                <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #cbd5e1" }}>
                  Descrição
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "8px",
                    borderBottom: "1px solid #cbd5e1",
                    width: "50px",
                  }}
                >
                  Qtd
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "8px",
                    borderBottom: "1px solid #cbd5e1",
                    width: "100px",
                  }}
                >
                  V. Unit.
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "8px",
                    borderBottom: "1px solid #cbd5e1",
                    width: "110px",
                  }}
                >
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {orcamento.itens.map((item) => (
                <tr key={item.id}>
                  <td style={{ padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
                    <div style={{ fontWeight: 600 }}>{item.descricao}</div>
                    <div style={{ fontSize: "10px", color: "#64748b" }}>
                      {CATEGORIA_LABELS[item.categoria] ?? item.categoria}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "8px",
                      textAlign: "right",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    {item.quantidade}
                  </td>
                  <td
                    style={{
                      padding: "8px",
                      textAlign: "right",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    {formatCurrency(item.precoUnitario)}
                  </td>
                  <td
                    style={{
                      padding: "8px",
                      textAlign: "right",
                      borderBottom: "1px solid #e2e8f0",
                      fontWeight: 600,
                    }}
                  >
                    {formatCurrency(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "12px",
            }}
          >
            <div style={{ minWidth: "240px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  fontSize: "16px",
                  fontWeight: 700,
                  backgroundColor: "#1d4ed8",
                  color: "#ffffff",
                  borderRadius: "6px",
                }}
              >
                <span>TOTAL</span>
                <span>{formatCurrency(orcamento.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {(orcamento.prazoExecucao ||
          orcamento.validadeOrcamento ||
          orcamento.garantia ||
          orcamento.condicoesPagamento) && (
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "8px",
              }}
            >
              Condições
            </div>
            <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
              <tbody>
                {orcamento.prazoExecucao && (
                  <tr>
                    <td style={{ padding: "4px 8px 4px 0", color: "#64748b", width: "180px" }}>
                      Prazo de Execução
                    </td>
                    <td style={{ padding: "4px 0" }}>{orcamento.prazoExecucao}</td>
                  </tr>
                )}
                {orcamento.validadeOrcamento && (
                  <tr>
                    <td style={{ padding: "4px 8px 4px 0", color: "#64748b" }}>
                      Validade do Orçamento
                    </td>
                    <td style={{ padding: "4px 0" }}>{orcamento.validadeOrcamento}</td>
                  </tr>
                )}
                {orcamento.garantia && (
                  <tr>
                    <td style={{ padding: "4px 8px 4px 0", color: "#64748b" }}>Garantia</td>
                    <td style={{ padding: "4px 0" }}>{orcamento.garantia}</td>
                  </tr>
                )}
                {orcamento.condicoesPagamento && (
                  <tr>
                    <td style={{ padding: "4px 8px 4px 0", color: "#64748b" }}>
                      Condições de Pagamento
                    </td>
                    <td style={{ padding: "4px 0" }}>{orcamento.condicoesPagamento}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {orcamento.observacoes && (
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "6px",
              }}
            >
              Observações
            </div>
            <div
              style={{
                fontSize: "11px",
                whiteSpace: "pre-wrap",
                borderLeft: "3px solid #cbd5e1",
                padding: "6px 12px",
                color: "#334155",
              }}
            >
              {orcamento.observacoes}
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: "48px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div style={{ width: "260px", textAlign: "center" }}>
            {tecnico.assinatura ? (
              <img
                src={tecnico.assinatura}
                alt="Assinatura"
                style={{ height: "70px", maxWidth: "100%", objectFit: "contain", display: "block", margin: "0 auto" }}
              />
            ) : (
              <div style={{ height: "70px" }} />
            )}
            <div
              style={{
                borderTop: "1px solid #0f172a",
                marginTop: "4px",
                paddingTop: "6px",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 600 }}>
                {tecnico.nome || "Técnico Responsável"}
              </div>
              {tecnico.registroTecnico && (
                <div style={{ fontSize: "10px", color: "#334155", marginTop: "2px" }}>
                  {tecnico.registroTecnico}
                </div>
              )}
              {tecnico.endereco && (
                <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>
                  {tecnico.endereco}
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "32px",
            paddingTop: "12px",
            borderTop: "1px solid #e2e8f0",
            textAlign: "center",
            fontSize: "10px",
            color: "#94a3b8",
          }}
        >
          Documento gerado pelo sistema Orcafrio · Orçamento Inteligente
        </div>
      </div>
    );
  }
);

OrcamentoPdf.displayName = "OrcamentoPdf";
