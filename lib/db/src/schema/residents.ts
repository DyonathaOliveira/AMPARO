import { pgTable, serial, text, timestamp, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const genderEnum = pgEnum("gender_type", ["male", "female", "other"]);
export const residentStatusEnum = pgEnum("resident_status", ["active", "inactive"]);

export const residentsTable = pgTable("residents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cpf: text("cpf").unique(),
  dateOfBirth: date("date_of_birth").notNull(),
  gender: genderEnum("gender").notNull(),
  room: text("room").notNull(),
  admissionDate: date("admission_date").notNull(),
  status: residentStatusEnum("status").notNull().default("active"),
  diagnoses: text("diagnoses"),
  allergies: text("allergies"),
  familyContact: text("family_contact"),
  familyPhone: text("family_phone"),
  clinicalNotes: text("clinical_notes"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertResidentSchema = createInsertSchema(residentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertResident = z.infer<typeof insertResidentSchema>;
export type Resident = typeof residentsTable.$inferSelect;
