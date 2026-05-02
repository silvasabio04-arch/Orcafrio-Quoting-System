import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  const userId = auth?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  req.userId = userId;

  try {
    let [user] = await db.select().from(usersTable).where(eq(usersTable.userId, userId));

    if (!user) {
      const email = (auth.sessionClaims?.email as string) ?? null;
      [user] = await db.insert(usersTable).values({ userId, email }).returning();
    }

    if (!user.isPaid) {
      const trialEnd = new Date(user.trialStartAt);
      trialEnd.setDate(trialEnd.getDate() + user.trialDays);
      if (new Date() > trialEnd) {
        return res.status(402).json({
          error: "Período de teste encerrado",
          trialExpired: true,
          trialEnd: trialEnd.toISOString(),
        });
      }
    }

    next();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
}
