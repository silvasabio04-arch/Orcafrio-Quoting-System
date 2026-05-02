import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const clientesTable = pgTable("clientes", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  nome: text("nome").notNull(),
  telefone: text("telefone").notNull(),
  email: text("email"),
  endereco: text("endereco"),
  cpfCnpj: text("cpf_cnpj"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClienteSchema = createInsertSchema(clientesTable).omit({ id: true, createdAt: true, userId: true });
export type InsertCliente = z.infer<typeof insertClienteSchema>;
export type Cliente = typeof clientesTable.$inferSelect;
