import { Router } from "express";
import { db, clientesTable, orcamentosTable, itensOrcamentoTable } from "@workspace/db";
import { sql, eq } from "drizzle-orm";

const router = Router();

router.get("/dashboard/resumo", async (req, res) => {
  try {
    const [totalOrcamentosResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orcamentosTable);
    const [totalClientesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(clientesTable);

    const statusCounts = await db
      .select({
        status: orcamentosTable.status,
        count: sql<number>`count(*)`,
        total: sql<number>`coalesce(sum(${orcamentosTable.total}::numeric), 0)`,
      })
      .from(orcamentosTable)
      .groupBy(orcamentosTable.status);

    const porStatus = {
      rascunho: 0,
      enviado: 0,
      aprovado: 0,
      recusado: 0,
      cancelado: 0,
    };
    let valorTotalAprovado = 0;
    let valorTotalPendente = 0;

    for (const row of statusCounts) {
      porStatus[row.status as keyof typeof porStatus] = Number(row.count);
      if (row.status === "aprovado") valorTotalAprovado = Number(row.total);
      if (row.status === "enviado") valorTotalPendente = Number(row.total);
    }

    res.json({
      totalOrcamentos: Number(totalOrcamentosResult?.count ?? 0),
      totalClientes: Number(totalClientesResult?.count ?? 0),
      valorTotalAprovado,
      valorTotalPendente,
      porStatus,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro ao buscar resumo" });
  }
});

router.get("/dashboard/orcamentos-recentes", async (req, res) => {
  try {
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
      .orderBy(sql`${orcamentosTable.createdAt} DESC`)
      .limit(5);

    res.json(rows.map((r) => ({ ...r, total: parseFloat(r.total as any) })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro ao buscar orçamentos recentes" });
  }
});

export default router;
