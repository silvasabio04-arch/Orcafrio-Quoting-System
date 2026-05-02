import { Router } from "express";
import { db, clientesTable, orcamentosTable, itensOrcamentoTable } from "@workspace/db";
import { eq, ilike, sql, and } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

const categoriaEnum = z.enum([
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

const itemBodySchema = z.object({
  categoria: categoriaEnum,
  descricao: z.string().min(1),
  quantidade: z.number().positive(),
  precoUnitario: z.number().nonnegative(),
});

async function calcularTotal(orcamentoId: number): Promise<number> {
  const itens = await db
    .select()
    .from(itensOrcamentoTable)
    .where(eq(itensOrcamentoTable.orcamentoId, orcamentoId));
  return itens.reduce((acc, item) => acc + parseFloat(item.subtotal), 0);
}

async function gerarNumero(userId: string): Promise<string> {
  const rows = await db
    .select({ numero: orcamentosTable.numero })
    .from(orcamentosTable)
    .where(eq(orcamentosTable.userId, userId));

  let maxNum = 0;
  for (const row of rows) {
    const match = row.numero.match(/^ORC-(\d+)$/);
    if (match) maxNum = Math.max(maxNum, parseInt(match[1]));
  }
  return `ORC-${String(maxNum + 1).padStart(3, "0")}`;
}

router.get("/orcamentos", requireAuth, async (req, res) => {
  try {
    const { status, clienteId, search } = req.query;
    const userId = req.userId!;

    const conditions: any[] = [eq(orcamentosTable.userId, userId)];
    if (status) conditions.push(eq(orcamentosTable.status, status as any));
    if (clienteId) conditions.push(eq(orcamentosTable.clienteId, parseInt(clienteId as string)));

    const rows = await db
      .select({
        id: orcamentosTable.id,
        numero: orcamentosTable.numero,
        clienteNome: clientesTable.nome,
        status: orcamentosTable.status,
        total: orcamentosTable.total,
        createdAt: orcamentosTable.createdAt,
      })
      .from(orcamentosTable)
      .innerJoin(clientesTable, eq(orcamentosTable.clienteId, clientesTable.id))
      .where(and(...conditions))
      .orderBy(sql`${orcamentosTable.createdAt} DESC`);

    let filtered = rows;
    if (search) {
      const s = (search as string).toLowerCase();
      filtered = rows.filter((r) => r.clienteNome.toLowerCase().includes(s) || r.numero.toLowerCase().includes(s));
    }

    res.json(filtered.map((r) => ({ ...r, total: parseFloat(r.total as any) })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro ao listar orçamentos" });
  }
});

router.post("/orcamentos", requireAuth, async (req, res) => {
  try {
    const schema = z.object({
      clienteId: z.number().int().positive(),
      prazoExecucao: z.string().nullable().optional(),
      validadeOrcamento: z.string().nullable().optional(),
      garantia: z.string().nullable().optional(),
      condicoesPagamento: z.string().nullable().optional(),
      observacoes: z.string().nullable().optional(),
      equipamentoTipo: z.string().nullable().optional(),
      equipamentoModelo: z.string().nullable().optional(),
      equipamentoCapacidade: z.string().nullable().optional(),
      itens: z.array(itemBodySchema).min(0),
    });
    const data = schema.parse(req.body);
    const userId = req.userId!;
    const numero = await gerarNumero(userId);

    const aprovacaoToken = crypto.randomUUID();

    const [orcamento] = await db
      .insert(orcamentosTable)
      .values({
        numero,
        userId,
        clienteId: data.clienteId,
        prazoExecucao: data.prazoExecucao ?? null,
        validadeOrcamento: data.validadeOrcamento ?? null,
        garantia: data.garantia ?? null,
        condicoesPagamento: data.condicoesPagamento ?? null,
        observacoes: data.observacoes ?? null,
        equipamentoTipo: data.equipamentoTipo ?? null,
        equipamentoModelo: data.equipamentoModelo ?? null,
        equipamentoCapacidade: data.equipamentoCapacidade ?? null,
        aprovacaoToken,
        total: "0",
        status: "rascunho",
      })
      .returning();

    if (data.itens.length > 0) {
      const itensToInsert = data.itens.map((item) => ({
        orcamentoId: orcamento.id,
        categoria: item.categoria,
        descricao: item.descricao,
        quantidade: String(item.quantidade),
        precoUnitario: String(item.precoUnitario),
        subtotal: String(item.quantidade * item.precoUnitario),
      }));
      await db.insert(itensOrcamentoTable).values(itensToInsert);

      const total = await calcularTotal(orcamento.id);
      await db
        .update(orcamentosTable)
        .set({ total: String(total), updatedAt: new Date() })
        .where(eq(orcamentosTable.id, orcamento.id));
    }

    const full = await getOrcamentoFull(orcamento.id);
    res.status(201).json(full);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Dados inválidos" });
  }
});

async function getOrcamentoFull(id: number) {
  const [orcamento] = await db.select().from(orcamentosTable).where(eq(orcamentosTable.id, id));
  if (!orcamento) return null;

  const [cliente] = await db.select().from(clientesTable).where(eq(clientesTable.id, orcamento.clienteId));

  const itens = await db.select().from(itensOrcamentoTable).where(eq(itensOrcamentoTable.orcamentoId, id));

  return {
    ...orcamento,
    total: parseFloat(orcamento.total as any),
    cliente,
    itens: itens.map((item) => ({
      ...item,
      quantidade: parseFloat(item.quantidade as any),
      precoUnitario: parseFloat(item.precoUnitario as any),
      subtotal: parseFloat(item.subtotal as any),
    })),
  };
}

router.get("/orcamentos/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const full = await getOrcamentoFull(id);
    if (!full || full.userId !== req.userId) return res.status(404).json({ error: "Orçamento não encontrado" });
    res.json(full);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro ao buscar orçamento" });
  }
});

router.put("/orcamentos/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const schema = z.object({
      clienteId: z.number().int().positive().optional(),
      prazoExecucao: z.string().nullable().optional(),
      validadeOrcamento: z.string().nullable().optional(),
      garantia: z.string().nullable().optional(),
      condicoesPagamento: z.string().nullable().optional(),
      observacoes: z.string().nullable().optional(),
      equipamentoTipo: z.string().nullable().optional(),
      equipamentoModelo: z.string().nullable().optional(),
      equipamentoCapacidade: z.string().nullable().optional(),
      itens: z.array(itemBodySchema).optional(),
    });
    const data = schema.parse(req.body);

    const [existing] = await db
      .select()
      .from(orcamentosTable)
      .where(and(eq(orcamentosTable.id, id), eq(orcamentosTable.userId, req.userId!)));
    if (!existing) return res.status(404).json({ error: "Orçamento não encontrado" });

    const updateData: any = { updatedAt: new Date() };
    if (data.clienteId !== undefined) updateData.clienteId = data.clienteId;
    if (data.prazoExecucao !== undefined) updateData.prazoExecucao = data.prazoExecucao;
    if (data.validadeOrcamento !== undefined) updateData.validadeOrcamento = data.validadeOrcamento;
    if (data.garantia !== undefined) updateData.garantia = data.garantia;
    if (data.condicoesPagamento !== undefined) updateData.condicoesPagamento = data.condicoesPagamento;
    if (data.observacoes !== undefined) updateData.observacoes = data.observacoes;
    if (data.equipamentoTipo !== undefined) updateData.equipamentoTipo = data.equipamentoTipo;
    if (data.equipamentoModelo !== undefined) updateData.equipamentoModelo = data.equipamentoModelo;
    if (data.equipamentoCapacidade !== undefined) updateData.equipamentoCapacidade = data.equipamentoCapacidade;

    await db.update(orcamentosTable).set(updateData).where(eq(orcamentosTable.id, id));

    if (data.itens !== undefined) {
      await db.delete(itensOrcamentoTable).where(eq(itensOrcamentoTable.orcamentoId, id));
      if (data.itens.length > 0) {
        const itensToInsert = data.itens.map((item) => ({
          orcamentoId: id,
          categoria: item.categoria,
          descricao: item.descricao,
          quantidade: String(item.quantidade),
          precoUnitario: String(item.precoUnitario),
          subtotal: String(item.quantidade * item.precoUnitario),
        }));
        await db.insert(itensOrcamentoTable).values(itensToInsert);
      }

      const total = await calcularTotal(id);
      await db
        .update(orcamentosTable)
        .set({ total: String(total), updatedAt: new Date() })
        .where(eq(orcamentosTable.id, id));
    }

    const full = await getOrcamentoFull(id);
    if (!full) return res.status(404).json({ error: "Orçamento não encontrado" });
    res.json(full);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Dados inválidos" });
  }
});

router.get("/aprovacao/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const [orc] = await db.select().from(orcamentosTable).where(eq(orcamentosTable.aprovacaoToken, token));
    if (!orc) return res.status(404).json({ error: "Orçamento não encontrado" });
    const [cliente] = await db.select().from(clientesTable).where(eq(clientesTable.id, orc.clienteId));
    const itens = await db.select().from(itensOrcamentoTable).where(eq(itensOrcamentoTable.orcamentoId, orc.id));
    res.json({
      numero: orc.numero,
      status: orc.status,
      createdAt: orc.createdAt,
      total: parseFloat(orc.total as any),
      prazoExecucao: orc.prazoExecucao,
      validadeOrcamento: orc.validadeOrcamento,
      garantia: orc.garantia,
      condicoesPagamento: orc.condicoesPagamento,
      observacoes: orc.observacoes,
      equipamentoTipo: orc.equipamentoTipo,
      equipamentoModelo: orc.equipamentoModelo,
      equipamentoCapacidade: orc.equipamentoCapacidade,
      respostaCliente: orc.respostaCliente,
      cliente: cliente ? { nome: cliente.nome, telefone: cliente.telefone } : null,
      itens: itens.map(i => ({
        id: i.id,
        categoria: i.categoria,
        descricao: i.descricao,
        quantidade: parseFloat(i.quantidade as any),
        precoUnitario: parseFloat(i.precoUnitario as any),
        subtotal: parseFloat(i.subtotal as any),
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro ao buscar orçamento" });
  }
});

router.post("/aprovacao/:token/resposta", async (req, res) => {
  try {
    const { token } = req.params;
    const { resposta, comentario } = z.object({
      resposta: z.enum(["aprovado", "recusado"]),
      comentario: z.string().max(500).optional(),
    }).parse(req.body);

    const [orc] = await db.select().from(orcamentosTable).where(eq(orcamentosTable.aprovacaoToken, token));
    if (!orc) return res.status(404).json({ error: "Orçamento não encontrado" });
    if (orc.respostaCliente) return res.status(409).json({ error: "Orçamento já respondido" });

    await db.update(orcamentosTable).set({
      respostaCliente: resposta,
      comentarioCliente: comentario ?? null,
      respostaAt: new Date(),
      respostaLida: false,
      status: resposta,
      updatedAt: new Date(),
    }).where(eq(orcamentosTable.aprovacaoToken, token));

    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Dados inválidos" });
  }
});

router.get("/notificacoes", requireAuth, async (req, res) => {
  try {
    const rows = await db
      .select({
        id: orcamentosTable.id,
        numero: orcamentosTable.numero,
        respostaCliente: orcamentosTable.respostaCliente,
        comentarioCliente: orcamentosTable.comentarioCliente,
        respostaAt: orcamentosTable.respostaAt,
        respostaLida: orcamentosTable.respostaLida,
        clienteNome: clientesTable.nome,
      })
      .from(orcamentosTable)
      .innerJoin(clientesTable, eq(orcamentosTable.clienteId, clientesTable.id))
      .where(and(
        eq(orcamentosTable.userId, req.userId!),
        sql`${orcamentosTable.respostaCliente} IS NOT NULL`,
      ))
      .orderBy(sql`${orcamentosTable.respostaAt} DESC`);
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro ao listar notificações" });
  }
});

router.post("/notificacoes/marcar-lidas", requireAuth, async (req, res) => {
  try {
    await db.update(orcamentosTable)
      .set({ respostaLida: true })
      .where(and(
        eq(orcamentosTable.userId, req.userId!),
        eq(orcamentosTable.respostaLida, false),
        sql`${orcamentosTable.respostaCliente} IS NOT NULL`,
      ));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro ao marcar notificações" });
  }
});

router.delete("/orcamentos/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db
      .delete(orcamentosTable)
      .where(and(eq(orcamentosTable.id, id), eq(orcamentosTable.userId, req.userId!)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro ao deletar orçamento" });
  }
});

router.patch("/orcamentos/:id/status", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const schema = z.object({
      status: z.enum(["rascunho", "enviado", "aprovado", "recusado", "cancelado"]),
    });
    const { status } = schema.parse(req.body);
    const [orcamento] = await db
      .update(orcamentosTable)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(orcamentosTable.id, id), eq(orcamentosTable.userId, req.userId!)))
      .returning();
    if (!orcamento) return res.status(404).json({ error: "Orçamento não encontrado" });
    const full = await getOrcamentoFull(id);
    res.json(full);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Dados inválidos" });
  }
});

router.post("/orcamentos/:id/itens", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [existing] = await db
      .select()
      .from(orcamentosTable)
      .where(and(eq(orcamentosTable.id, id), eq(orcamentosTable.userId, req.userId!)));
    if (!existing) return res.status(404).json({ error: "Orçamento não encontrado" });

    const item = itemBodySchema.parse(req.body);
    const [novoItem] = await db
      .insert(itensOrcamentoTable)
      .values({
        orcamentoId: id,
        categoria: item.categoria,
        descricao: item.descricao,
        quantidade: String(item.quantidade),
        precoUnitario: String(item.precoUnitario),
        subtotal: String(item.quantidade * item.precoUnitario),
      })
      .returning();

    const total = await calcularTotal(id);
    await db
      .update(orcamentosTable)
      .set({ total: String(total), updatedAt: new Date() })
      .where(eq(orcamentosTable.id, id));

    res.status(201).json({
      ...novoItem,
      quantidade: parseFloat(novoItem.quantidade as any),
      precoUnitario: parseFloat(novoItem.precoUnitario as any),
      subtotal: parseFloat(novoItem.subtotal as any),
    });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Dados inválidos" });
  }
});

router.put("/orcamentos/:id/itens/:itemId", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const itemId = parseInt(req.params.itemId);
    const item = itemBodySchema.parse(req.body);

    const [updated] = await db
      .update(itensOrcamentoTable)
      .set({
        categoria: item.categoria,
        descricao: item.descricao,
        quantidade: String(item.quantidade),
        precoUnitario: String(item.precoUnitario),
        subtotal: String(item.quantidade * item.precoUnitario),
      })
      .where(eq(itensOrcamentoTable.id, itemId))
      .returning();

    const total = await calcularTotal(id);
    await db
      .update(orcamentosTable)
      .set({ total: String(total), updatedAt: new Date() })
      .where(eq(orcamentosTable.id, id));

    res.json({
      ...updated,
      quantidade: parseFloat(updated.quantidade as any),
      precoUnitario: parseFloat(updated.precoUnitario as any),
      subtotal: parseFloat(updated.subtotal as any),
    });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Dados inválidos" });
  }
});

router.delete("/orcamentos/:id/itens/:itemId", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const itemId = parseInt(req.params.itemId);
    await db.delete(itensOrcamentoTable).where(eq(itensOrcamentoTable.id, itemId));
    const total = await calcularTotal(id);
    await db
      .update(orcamentosTable)
      .set({ total: String(total), updatedAt: new Date() })
      .where(eq(orcamentosTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro ao remover item" });
  }
});

export default router;
