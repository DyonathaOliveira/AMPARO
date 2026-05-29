import { pgTable, serial, text, timestamp, integer, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { residentsTable } from "./residents";

export const medicationStatusEnum = pgEnum("medication_status", ["administered", "pending", "late"]);

export const medicationsTable = pgTable("medications", {
  id: serial("id").primaryKey(),
  residentId: integer("resident_id").notNull().references(() => residentsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  dose: text("dose").notNull(),
  frequency: text("frequency").notNull(),
  scheduledTimes: text("scheduled_times").array().notNull().default([]),
  status: medicationStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const medicationAdministrationsTable = pgTable("medication_administrations", {
  id: serial("id").primaryKey(),
  medicationId: integer("medication_id").notNull().references(() => medicationsTable.id, { onDelete: "cascade" }),
  administeredAt: timestamp("administered_at").notNull(),
  administeredBy: text("administered_by").notNull(),
  notes: text("notes"),
  isLate: boolean("is_late").notNull().default(false),
  lateJustification: text("late_justification"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMedicationSchema = createInsertSchema(medicationsTable).omit({ id: true, createdAt: true });
export const insertAdministrationSchema = createInsertSchema(medicationAdministrationsTable).omit({ id: true, createdAt: true });
export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type Medication = typeof medicationsTable.$inferSelect;
export type MedicationAdministration = typeof medicationAdministrationsTable.$inferSelect;
