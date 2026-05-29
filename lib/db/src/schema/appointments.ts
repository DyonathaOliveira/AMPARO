import { pgTable, serial, text, timestamp, date, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { residentsTable } from "./residents";

export const appointmentStatusEnum = pgEnum("appointment_status", ["scheduled", "confirmed", "completed", "cancelled"]);

export const appointmentsTable = pgTable("appointments", {
  id: serial("id").primaryKey(),
  residentId: integer("resident_id").notNull().references(() => residentsTable.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  time: text("time").notNull(),
  specialty: text("specialty").notNull(),
  status: appointmentStatusEnum("status").notNull().default("scheduled"),
  observations: text("observations"),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAppointmentSchema = createInsertSchema(appointmentsTable).omit({ id: true, createdAt: true });
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointmentsTable.$inferSelect;
