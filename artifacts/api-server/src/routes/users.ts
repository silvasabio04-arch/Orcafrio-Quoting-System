import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/users/me", requireAuth, async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.userId, req.userId!));
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const trialEnd = new Date(user.trialStartAt);
    trialEnd.setDate(trialEnd.getDate() + user.trialDays);
    const now = new Date();
    const msLeft = trialEnd.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
    const trialExpired = !user.isPaid && now > trialEnd;

    res.json({
      userId: user.userId,
      email: user.email,
      isPaid: user.isPaid,
      trialExpired,
      trialEnd: trialEnd.toISOString(),
      daysLeft,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
