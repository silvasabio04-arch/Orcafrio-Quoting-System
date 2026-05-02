import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  userId: text("user_id").primaryKey(),
  email: text("email"),
  trialStartAt: timestamp("trial_start_at").defaultNow().notNull(),
  trialDays: integer("trial_days").default(30).notNull(),
  isPaid: boolean("is_paid").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof usersTable.$inferSelect;
