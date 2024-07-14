import { relations } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  uid: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  department: text("department").notNull(),
  lineUid: text("line_uid").unique(),
});

export type User = typeof users.$inferSelect;

export const seats = sqliteTable("seats", {
  id: text("id").primaryKey(),
  seat: text("seat"),
  round: integer("round").notNull(),
  transactionId: text("transaction_id").references(() => transactions.id),
});

export type Seat = typeof seats.$inferSelect;

export const seatsRelations = relations(seats, ({ one }) => ({
  transaction: one(transactions, {
    fields: [seats.transactionId],
    references: [transactions.id],
  }),
}));

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  uid: text("uid")
    .notNull()
    .references(() => users.uid),
  round: integer("round").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  submittedAt: integer("submitted_at", { mode: "timestamp_ms" }).notNull(),
});

export const transactionsRelations = relations(transactions, ({ many }) => ({
  seats: many(seats),
}));
