import { Router } from "express";
import { db, clientesTable } from "@workspace/db";
import { eq, ilike, or, and, desc } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/clientes", requireAuth, async (req, res) => {
  try {
    const search = req.query.search as string | undefined;
    const userId = req.userId!;

    const userCondition = eq(clientesTable.userId, userId);
    let clientes;
    if (search) {
      clientes = await db
        .select()
        .from(clientesTable)
        .where(
          and(
            userCondition,
            or(
              ilike(clientesTable.nome, `%${search}%`),
              ilike(clientesTable.telefone, `%${search}%`)
            )
          )
        )
        .orderBy(desc(clientesTable.createdAt));
    } else {
      clientes = await db
        .select()
        .from(clientesTable)
        .where(userCondition)
        .orderBy(desc(clientesTable.createdAt));
    }
    res.json(clientes);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro ao buscar clientes" });
  }
});

router.post("/clientes", requireAuth, async (req, res) => {
  try {
    const schema = z.object({
      nome: z.string().min(1),
      telefone: z.string().min(1),
      email: z.string().nullable().optional(),
      endereco: z.string().nullable().optional(),
      cpfCnpj: z.string().nullable().optional(),
    });
    const data = schema.parse(req.body);
    const [cliente] = await db
      .insert(clientesTable)
      .values({ ...data, userId: req.userId! })
      .returning();
    res.status(201).json(cliente);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Dados inválidos" });
  }
});

router.get("/clientes/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [cliente] = await db
      .select()
      .from(clientesTable)
      .where(and(eq(clientesTable.id, id), eq(clientesTable.userId, req.userId!)));
    if (!cliente) return res.status(404).json({ error: "Cliente não encontrado" });
    res.json(cliente);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro ao buscar cliente" });
  }
});

router.put("/clientes/:id", requireAuth, async (req, res) => {
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
      .where(and(eq(clientesTable.id, id), eq(clientesTable.userId, req.userId!)))
      .returning();
    if (!cliente) return res.status(404).json({ error: "Cliente não encontrado" });
    res.json(cliente);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Dados inválidos" });
  }
});

router.delete("/clientes/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db
      .delete(clientesTable)
      .where(and(eq(clientesTable.id, id), eq(clientesTable.userId, req.userId!)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro ao deletar cliente" });
  }
});

export default router;
