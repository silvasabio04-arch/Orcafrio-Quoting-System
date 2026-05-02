import { Router } from "express";
import { db, clientesTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";
import { z } from "zod";

const router = Router();

router.get("/clientes", async (req, res) => {
  try {
    const search = req.query.search as string | undefined;
    let clientes;
    if (search) {
      clientes = await db
        .select()
        .from(clientesTable)
        .where(
          or(
            ilike(clientesTable.nome, `%${search}%`),
            ilike(clientesTable.telefone, `%${search}%`)
          )
        )
        .orderBy(clientesTable.nome);
    } else {
      clientes = await db.select().from(clientesTable).orderBy(clientesTable.nome);
    }
    res.json(clientes);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro ao buscar clientes" });
  }
});

router.post("/clientes", async (req, res) => {
  try {
    const schema = z.object({
      nome: z.string().min(1),
      telefone: z.string().min(1),
      email: z.string().nullable().optional(),
      endereco: z.string().nullable().optional(),
      cpfCnpj: z.string().nullable().optional(),
    });
    const data = schema.parse(req.body);
    const [cliente] = await db.insert(clientesTable).values(data).returning();
    res.status(201).json(cliente);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Dados inválidos" });
  }
});

router.get("/clientes/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [cliente] = await db.select().from(clientesTable).where(eq(clientesTable.id, id));
    if (!cliente) return res.status(404).json({ error: "Cliente não encontrado" });
    res.json(cliente);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro ao buscar cliente" });
  }
});

router.put("/clientes/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const schema = z.object({
      nome: z.string().min(1),
      telefone: z.string().min(1),
      email: z.string().nullable().optional(),
      endereco: z.string().nullable().optional(),
      cpfCnpj: z.string().nullable().optional(),
    });
    const data = schema.parse(req.body);
    const [cliente] = await db
      .update(clientesTable)
      .set(data)
      .where(eq(clientesTable.id, id))
      .returning();
    if (!cliente) return res.status(404).json({ error: "Cliente não encontrado" });
    res.json(cliente);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Dados inválidos" });
  }
});

router.delete("/clientes/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(clientesTable).where(eq(clientesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro ao deletar cliente" });
  }
});

export default router;
