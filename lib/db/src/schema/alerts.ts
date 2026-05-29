import { pgTable, serial, text, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { residentsTable } from "./residents";

export const alertTypeEnum = pgEnum("alert_type", ["medication", "activity", "appointment", "incident"]);
export const alertSeverityEnum = pgEnum("alert_severity", ["low", "medium", "high", "critical"]);

export const alertsTable = pgTable("alerts", {
  id: serial("id").primaryKey(),
  type: alertTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: alertSeverityEnum("severity").notNull().default("medium"),
  resolved: boolean("resolved").notNull().default(false),
  residentId: integer("resident_id").references(() => residentsTable.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAlertSchema = createInsertSchema(alertsTable).omit({ id: true, createdAt: true, resolved: true, resolvedAt: true });
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alertsTable.$inferSelect;
