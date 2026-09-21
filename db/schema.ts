import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const accounts = sqliteTable("ledger_accounts", {
  userId: text("user_id").primaryKey(),
  revision: integer("revision").notNull().default(1),
  document: text("document").notNull(),
  updatedAt: text("updated_at").notNull(),
});
