import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, appointmentsTable, residentsTable } from "@workspace/db";
import {
  ListAppointmentsQueryParams,
  ListAppointmentsResponse,
  CreateAppointmentBody,
  GetAppointmentParams,
  GetAppointmentResponse,
  UpdateAppointmentParams,
  UpdateAppointmentBody,
  UpdateAppointmentResponse,
  DeleteAppointmentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseId(raw: unknown): number | null {
  const id = parseInt(String(raw), 10);
  return isNaN(id) ? null : id;
}

function mapAppointment(a: typeof appointmentsTable.$inferSelect, residentName?: string) {
  return {
    id: a.id,
    residentId: a.residentId,
    residentName: residentName ?? null,
    date: a.date,
    time: a.time,
    specialty: a.specialty,
    status: a.status,
    observations: a.observations ?? null,
    cancellationReason: a.cancellationReason ?? null,
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/appointments", async (req, res): Promise<void> => {
  const params = ListAppointmentsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];
  if (params.data.residentId) {
    conditions.push(eq(appointmentsTable.residentId, params.data.residentId));
  }
  if (params.data.date) {
    conditions.push(eq(appointmentsTable.date, params.data.date));
  }
  if (params.data.status) {
    conditions.push(eq(appointmentsTable.status, params.data.status as "scheduled" | "confirmed" | "completed" | "cancelled"));
  }

  const appointments = await db
    .select({
      appointment: appointmentsTable,
      residentName: residentsTable.name,
    })
    .from(appointmentsTable)
    .leftJoin(residentsTable, eq(appointmentsTable.residentId, residentsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(appointmentsTable.date, appointmentsTable.time);

  res.json(ListAppointmentsResponse.parse(
    appointments.map(({ appointment, residentName }) => mapAppointment(appointment, residentName ?? undefined))
  ));
});

router.post("/appointments", async (req, res): Promise<void> => {
  const parsed = CreateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [apt] = await db.insert(appointmentsTable).values({
    residentId: parsed.data.residentId,
    date: parsed.data.date,
    time: parsed.data.time,
    specialty: parsed.data.specialty,
    status: "scheduled",
    observations: parsed.data.observations ?? null,
  }).returning();

  const [resident] = await db.select().from(residentsTable).where(eq(residentsTable.id, apt.residentId));
  res.status(201).json(mapAppointment(apt, resident?.name));
});

router.get("/appointments/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [result] = await db
    .select({ appointment: appointmentsTable, residentName: residentsTable.name })
    .from(appointmentsTable)
    .leftJoin(residentsTable, eq(appointmentsTable.residentId, residentsTable.id))
    .where(eq(appointmentsTable.id, id));

  if (!result) { res.status(404).json({ error: "Consulta não encontrada" }); return; }

  res.json(GetAppointmentResponse.parse(mapAppointment(result.appointment, result.residentName ?? undefined)));
});

router.patch("/appointments/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

  const parsed = UpdateAppointmentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [apt] = await db.update(appointmentsTable)
    .set(parsed.data)
    .where(eq(appointmentsTable.id, id))
    .returning();

  if (!apt) { res.status(404).json({ error: "Consulta não encontrada" }); return; }

  const [resident] = await db.select().from(residentsTable).where(eq(residentsTable.id, apt.residentId));
  res.json(UpdateAppointmentResponse.parse(mapAppointment(apt, resident?.name)));
});

router.delete("/appointments/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [deleted] = await db.delete(appointmentsTable).where(eq(appointmentsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Consulta não encontrada" }); return; }

  res.sendStatus(204);
});

export default router;
