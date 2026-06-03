import { Router, type IRouter } from "express";
import { eq, ilike, or } from "drizzle-orm";
import { db, residentsTable } from "@workspace/db";
import {
  ListResidentsQueryParams,
  ListResidentsResponse,
  CreateResidentBody,
  GetResidentParams,
  GetResidentResponse,
  UpdateResidentParams,
  UpdateResidentBody,
  UpdateResidentResponse,
  DeleteResidentParams,
  GetResidentProfileParams,
  GetResidentProfileResponse,
} from "@workspace/api-zod";
import { medicationsTable, activitiesTable, appointmentsTable } from "@workspace/db";

const router: IRouter = Router();

function parseId(raw: unknown): number | null {
  const id = parseInt(String(raw), 10);
  return isNaN(id) ? null : id;
}

function mapResident(r: typeof residentsTable.$inferSelect) {
  return {
    id: r.id,
    name: r.name,
    cpf: r.cpf ?? null,
    dateOfBirth: r.dateOfBirth,
    gender: r.gender,
    room: r.room,
    admissionDate: r.admissionDate,
    status: r.status,
    diagnoses: r.diagnoses ?? null,
    allergies: r.allergies ?? null,
    familyContact: r.familyContact ?? null,
    familyPhone: r.familyPhone ?? null,
    clinicalNotes: r.clinicalNotes ?? null,
    photoUrl: r.photoUrl ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

router.get("/residents", async (req, res): Promise<void> => {
  const params = ListResidentsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let query = db.select().from(residentsTable).$dynamic();

  if (params.data.status) {
    query = query.where(eq(residentsTable.status, params.data.status as "active" | "inactive"));
  }

  const residents = await query.orderBy(residentsTable.name);

  let filtered = residents;
  if (params.data.search) {
    const s = params.data.search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    filtered = residents.filter(r => {
      const name = r.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return name.includes(s) || r.room.toLowerCase().includes(s) || (r.cpf && r.cpf.includes(s));
    });
  }

  res.json(ListResidentsResponse.parse(filtered.map(mapResident)));
});

router.post("/residents", async (req, res): Promise<void> => {
  const parsed = CreateResidentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const toDateStr = (d: Date | string) =>
    d instanceof Date ? d.toISOString().split("T")[0] : String(d);

  const [resident] = await db.insert(residentsTable).values({
    name: parsed.data.name,
    cpf: parsed.data.cpf ?? null,
    dateOfBirth: toDateStr(parsed.data.dateOfBirth),
    gender: parsed.data.gender,
    room: parsed.data.room,
    admissionDate: toDateStr(parsed.data.admissionDate),
    status: "active",
    diagnoses: parsed.data.diagnoses ?? null,
    allergies: parsed.data.allergies ?? null,
    familyContact: parsed.data.familyContact ?? null,
    familyPhone: parsed.data.familyPhone ?? null,
    clinicalNotes: parsed.data.clinicalNotes ?? null,
  }).returning();

  res.status(201).json(GetResidentResponse.parse(mapResident(resident)));
});

router.get("/residents/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [resident] = await db.select().from(residentsTable).where(eq(residentsTable.id, id));
  if (!resident) { res.status(404).json({ error: "Residente não encontrado" }); return; }

  res.json(GetResidentResponse.parse(mapResident(resident)));
});

router.patch("/residents/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

  const parsed = UpdateResidentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [resident] = await db.update(residentsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(residentsTable.id, id))
    .returning();

  if (!resident) { res.status(404).json({ error: "Residente não encontrado" }); return; }

  res.json(UpdateResidentResponse.parse(mapResident(resident)));
});

router.delete("/residents/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [deleted] = await db.delete(residentsTable).where(eq(residentsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Residente não encontrado" }); return; }

  res.sendStatus(204);
});

router.get("/residents/:id/profile", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [resident] = await db.select().from(residentsTable).where(eq(residentsTable.id, id));
  if (!resident) { res.status(404).json({ error: "Residente não encontrado" }); return; }

  const medications = await db.select().from(medicationsTable).where(eq(medicationsTable.residentId, id));
  const activities = await db.select().from(activitiesTable).where(eq(activitiesTable.residentId, id));
  const appointments = await db.select().from(appointmentsTable).where(eq(appointmentsTable.residentId, id));

  res.json(GetResidentProfileResponse.parse({
    resident: mapResident(resident),
    medications: medications.map(m => ({
      id: m.id,
      residentId: m.residentId,
      residentName: resident.name,
      name: m.name,
      dose: m.dose,
      frequency: m.frequency,
      scheduledTimes: m.scheduledTimes,
      status: m.status,
      notes: m.notes ?? null,
      createdAt: m.createdAt.toISOString(),
    })),
    activities: activities.map(a => ({
      id: a.id,
      residentId: a.residentId,
      residentName: resident.name,
      type: a.type,
      date: a.date,
      time: a.time ?? null,
      status: a.status,
      observations: a.observations ?? null,
      shift: a.shift,
      createdAt: a.createdAt.toISOString(),
    })),
    appointments: appointments.map(ap => ({
      id: ap.id,
      residentId: ap.residentId,
      residentName: resident.name,
      date: ap.date,
      time: ap.time,
      specialty: ap.specialty,
      status: ap.status,
      observations: ap.observations ?? null,
      cancellationReason: ap.cancellationReason ?? null,
      createdAt: ap.createdAt.toISOString(),
    })),
    handoverNotes: [],
  }));
});

export default router;
