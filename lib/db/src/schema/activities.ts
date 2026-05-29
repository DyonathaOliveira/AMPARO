import { pgTable, serial, text, timestamp, date, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { residentsTable } from "./residents";

export const activityTypeEnum = pgEnum("activity_type", ["bath", "feeding", "hygiene", "physiotherapy", "medication", "other"]);
export const activityStatusEnum = pgEnum("activity_status", ["completed", "pending", "not_done"]);
export const activityShiftEnum = pgEnum("activity_shift", ["morning", "afternoon", "night"]);

export const activitiesTable = pgTable("activities", {
  id: serial("id").primaryKey(),
  residentId: integer("resident_id").notNull().references(() => residentsTable.id, { onDelete: "cascade" }),
  type: activityTypeEnum("type").notNull(),
  date: date("date").notNull(),
  time: text("time"),
  status: activityStatusEnum("status").notNull().default("pending"),
  observations: text("observations"),
  shift: activityShiftEnum("shift").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertActivitySchema = createInsertSchema(activitiesTable).omit({ id: true, createdAt: true });
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activitiesTable.$inferSelect;
