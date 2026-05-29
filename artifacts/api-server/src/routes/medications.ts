import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, medicationsTable, medicationAdministrationsTable, residentsTable } from "@workspace/db";
import {
  ListMedicationsQueryParams,
  ListMedicationsResponse,
  CreateMedicationBody,
  UpdateMedicationParams,
  UpdateMedicationBody,
  UpdateMedicationResponse,
  DeleteMedicationParams,
  AdministerMedicationParams,
  AdministerMedicationBody,
  GetMedicationAdministrationsParams,
  GetMedicationAdministrationsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseId(raw: unknown): number | null {
  const id = parseInt(String(raw), 10);
  return isNaN(id) ? null : id;
}

function mapMedication(m: typeof medicationsTable.$inferSelect, residentName?: string) {
  return {
    id: m.id,
    residentId: m.residentId,
    residentName: residentName ?? null,
    name: m.name,
    dose: m.dose,
    frequency: m.frequency,
    scheduledTimes: m.scheduledTimes,
    status: m.status,
    notes: m.notes ?? null,
    createdAt: m.createdAt.toISOString(),
  };
}

router.get("/medications", async (req, res): Promise<void> => {
  const params = ListMedicationsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];
  if (params.data.residentId) {
    conditions.push(eq(medicationsTable.residentId, params.data.residentId));
  }
  if (params.data.status) {
    conditions.push(eq(medicationsTable.status, params.data.status as "administered" | "pending" | "late"));
  }

  const medications = await db
    .select({
      medication: medicationsTable,
      residentName: residentsTable.name,
    })
    .from(medicationsTable)
    .leftJoin(residentsTable, eq(medicationsTable.residentId, residentsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(medicationsTable.name);

  res.json(ListMedicationsResponse.parse(
    medications.map(({ medication, residentName }) => mapMedication(medication, residentName ?? undefined))
  ));
});

router.post("/medications", async (req, res): Promise<void> => {
  const parsed = CreateMedicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [med] = await db.insert(medicationsTable).values({
    residentId: parsed.data.residentId,
    name: parsed.data.name,
    dose: parsed.data.dose,
    frequency: parsed.data.frequency,
    scheduledTimes: parsed.data.scheduledTimes,
    status: "pending",
    notes: parsed.data.notes ?? null,
  }).returning();

  res.status(201).json(mapMedication(med));
});

router.patch("/medications/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

  const parsed = UpdateMedicationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [med] = await db.update(medicationsTable)
    .set(parsed.data)
    .where(eq(medicationsTable.id, id))
    .returning();

  if (!med) { res.status(404).json({ error: "Medicamento não encontrado" }); return; }

  res.json(UpdateMedicationResponse.parse(mapMedication(med)));
});

router.delete("/medications/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [deleted] = await db.delete(medicationsTable).where(eq(medicationsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Medicamento não encontrado" }); return; }

  res.sendStatus(204);
});

router.post("/medications/:id/administer", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

  const parsed = AdministerMedicationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const administeredAt = new Date(parsed.data.administeredAt);
  const [admin] = await db.insert(medicationAdministrationsTable).values({
    medicationId: id,
    administeredAt,
    administeredBy: parsed.data.administeredBy,
    notes: parsed.data.notes ?? null,
    isLate: !!parsed.data.lateJustification,
    lateJustification: parsed.data.lateJustification ?? null,
  }).returning();

  // Update medication status to administered
  await db.update(medicationsTable)
    .set({ status: "administered" })
    .where(eq(medicationsTable.id, id));

  res.status(201).json({
    id: admin.id,
    medicationId: admin.medicationId,
    administeredAt: admin.administeredAt.toISOString(),
    administeredBy: admin.administeredBy,
    notes: admin.notes ?? null,
    isLate: admin.isLate,
    lateJustification: admin.lateJustification ?? null,
  });
});

router.get("/medications/:id/administrations", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

  const admins = await db.select()
    .from(medicationAdministrationsTable)
    .where(eq(medicationAdministrationsTable.medicationId, id))
    .orderBy(medicationAdministrationsTable.administeredAt);

  res.json(GetMedicationAdministrationsResponse.parse(
    admins.map(a => ({
      id: a.id,
      medicationId: a.medicationId,
      administeredAt: a.administeredAt.toISOString(),
      administeredBy: a.administeredBy,
      notes: a.notes ?? null,
      isLate: a.isLate,
      lateJustification: a.lateJustification ?? null,
    }))
  ));
});

export default router;
