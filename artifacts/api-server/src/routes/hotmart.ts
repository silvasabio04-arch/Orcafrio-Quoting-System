import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const APROVADO = new Set([
  "PURCHASE_COMPLETE",
  "PURCHASE_APPROVED",
  "PURCHASE_OUT_OF_SHOPPING_CART",
]);

const CANCELADO = new Set([
  "PURCHASE_REFUNDED",
  "PURCHASE_CHARGEBACK",
  "PURCHASE_CANCELED",
  "PURCHASE_PROTEST",
]);

router.post("/hotmart/webhook", async (req, res) => {
  try {
    const hottok = process.env.HOTMART_HOTTOK;

    if (hottok) {
      const receivedHottok =
        (req.headers["x-hotmart-hottok"] as string) ?? req.body?.hottok;

      if (receivedHottok !== hottok) {
        req.log.warn("Hotmart webhook: hottok inválido");
        return res.status(401).json({ error: "Unauthorized" });
      }
    }

    const event: string = req.body?.event ?? "";
    const email: string | undefined = req.body?.data?.buyer?.email;

    req.log.info({ event, email }, "Hotmart webhook recebido");

    if (!email) {
      return res.status(400).json({ error: "Email do comprador ausente" });
    }

    if (APROVADO.has(event)) {
      const result = await db
        .update(usersTable)
        .set({ isPaid: true })
        .where(eq(usersTable.email, email.toLowerCase()))
        .returning();

      req.log.info({ email, updated: result.length }, "Acesso liberado");
    } else if (CANCELADO.has(event)) {
      const result = await db
        .update(usersTable)
        .set({ isPaid: false })
        .where(eq(usersTable.email, email.toLowerCase()))
        .returning();

      req.log.info({ email, updated: result.length }, "Acesso revogado");
    }

    res.status(200).json({ received: true });
  } catch (err) {
    req.log.error(err, "Erro no webhook Hotmart");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/payment/checkout-url", (req, res) => {
  const url = process.env.HOTMART_CHECKOUT_URL ?? "";
  res.json({ url });
});

export default router;
