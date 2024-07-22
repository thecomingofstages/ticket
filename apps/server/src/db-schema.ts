import { relations, sql } from "drizzle-orm";
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

export const seatsRelations = relations(seats, ({ one, many }) => ({
  transaction: one(transactions, {
    fields: [seats.transactionId],
    references: [transactions.id],
  }),
  transfer: many(seatTransfers),
}));

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  uid: text("uid")
    .notNull()
    .references(() => users.uid),
  round: integer("round").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  submittedAt: integer("submitted_at", { mode: "timestamp_ms" }),
  // Definition of the `isTransfered` field.
  // - true: the transaction is a completed transfer and already assigned to the new owner uid.
  // - false: the transaction is a pending transfer and assigned to the current owner uid.
  // - null: the transaction is a normal transaction.
  isTransfered: integer("is_transfered", { mode: "boolean" }),
});

export const transactionsRelations = relations(
  transactions,
  ({ many, one }) => ({
    seats: many(seats),
    transfers: many(seatTransfers, {
      relationName: "fromTransaction",
    }),
    owner: one(users, {
      fields: [transactions.uid],
      references: [users.uid],
    }),
  })
);

export type Transaction = typeof transactions.$inferSelect;

// actual transfer is easy as updating the seat.transactionId field to the new transaction
// however one transfer can involve multiple seats and multiple source transactions
// so this table is created to keep track of all the transfers and allow rollback if needed
export const seatTransfers = sqliteTable("seat_transfers", {
  id: text("id").primaryKey(),
  seatId: text("seat_id")
    .references(() => seats.id)
    .notNull(),
  toTransactionId: text("to_tr_id").references(() => transactions.id, {
    // also remove these transfers if the transaction is deleted
    onDelete: "cascade",
  }),
  fromTransactionId: text("from_tr_id")
    .references(() => transactions.id, {
      // don't allow deleting transaction if it has a transfer linked to it
      onDelete: "restrict",
    })
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  transferAcceptId: text("transfer_accept_id").notNull(),
});

export const seatTransferRelations = relations(seatTransfers, ({ one }) => ({
  seat: one(seats, {
    fields: [seatTransfers.seatId],
    references: [seats.id],
  }),
  transferedTo: one(transactions, {
    fields: [seatTransfers.toTransactionId],
    references: [transactions.id],
    relationName: "transferTransaction",
  }),
  transferedFrom: one(transactions, {
    fields: [seatTransfers.fromTransactionId],
    references: [transactions.id],
    relationName: "fromTransaction",
  }),
}));

export type SeatTransfer = typeof seatTransfers.$inferSelect;
