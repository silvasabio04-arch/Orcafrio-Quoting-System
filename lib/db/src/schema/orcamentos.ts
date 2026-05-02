import { pgTable, serial, text, timestamp, numeric, integer, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientesTable } from "./clientes";

export const statusOrcamentoEnum = pgEnum("status_orcamento", [
  "rascunho",
  "enviado",
  "aprovado",
  "recusado",
  "cancelado",
]);

export const categoriaItemEnum = pgEnum("categoria_item", [
  "manutencao_preventiva",
  "higienizacao",
  "instalacao",
  "troca_compressor",
  "carga_gas",
  "diagnostico",
  "conserto",
  "mao_de_obra",
  "outros",
]);

export const orcamentosTable = pgTable("orcamentos", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  numero: text("numero").notNull(),
  clienteId: integer("cliente_id")
    .notNull()
    .references(() => clientesTable.id),
  status: statusOrcamentoEnum("status").notNull().default("rascunho"),
  prazoExecucao: text("prazo_execucao"),
  validadeOrcamento: text("validade_orcamento"),
  garantia: text("garantia"),
  condicoesPagamento: text("condicoes_pagamento"),
  observacoes: text("observacoes"),
  equipamentoTipo: text("equipamento_tipo"),
  equipamentoModelo: text("equipamento_modelo"),
  equipamentoCapacidade: text("equipamento_capacidade"),
  aprovacaoToken: text("aprovacao_token"),
  respostaCliente: text("resposta_cliente"),
  comentarioCliente: text("comentario_cliente"),
  respostaAt: timestamp("resposta_at"),
  respostaLida: boolean("resposta_lida").default(false),
  total: numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const itensOrcamentoTable = pgTable("itens_orcamento", {
  id: serial("id").primaryKey(),
  orcamentoId: integer("orcamento_id")
    .notNull()
    .references(() => orcamentosTable.id, { onDelete: "cascade" }),
  categoria: categoriaItemEnum("categoria").notNull(),
  descricao: text("descricao").notNull(),
  quantidade: numeric("quantidade", { precision: 10, scale: 2 }).notNull(),
  precoUnitario: numeric("preco_unitario", { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
});

export const insertOrcamentoSchema = createInsertSchema(orcamentosTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
});
export const insertItemSchema = createInsertSchema(itensOrcamentoTable).omit({ id: true });

export type InsertOrcamento = z.infer<typeof insertOrcamentoSchema>;
export type Orcamento = typeof orcamentosTable.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type ItemOrcamento = typeof itensOrcamentoTable.$inferSelect;
