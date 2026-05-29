import { pgTable, serial, text, timestamp, date, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const handoverShiftEnum = pgEnum("handover_shift", ["morning", "afternoon", "night"]);

export const handoversTable = pgTable("handovers", {
  id: serial("id").primaryKey(),
  shift: handoverShiftEnum("shift").notNull(),
  date: date("date").notNull(),
  createdBy: text("created_by").notNull(),
  occurrences: text("occurrences").notNull(),
  pendencies: text("pendencies"),
  isRead: boolean("is_read").notNull().default(false),
  readBy: text("read_by"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertHandoverSchema = createInsertSchema(handoversTable).omit({ id: true, createdAt: true, isRead: true, readBy: true, readAt: true });
export type InsertHandover = z.infer<typeof insertHandoverSchema>;
export type Handover = typeof handoversTable.$inferSelect;
