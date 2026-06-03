import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, activitiesTable, residentsTable } from "@workspace/db";
import {
  ListActivitiesQueryParams,
  ListActivitiesResponse,
  CreateActivityBody,
  UpdateActivityParams,
  UpdateActivityBody,
  UpdateActivityResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseId(raw: unknown): number | null {
  const id = parseInt(String(raw), 10);
  return isNaN(id) ? null : id;
}

function mapActivity(a: typeof activitiesTable.$inferSelect, residentName?: string) {
  return {
    id: a.id,
    residentId: a.residentId,
    residentName: residentName ?? null,
    type: a.type,
    date: a.date,
    time: a.time ?? null,
    status: a.status,
    observations: a.observations ?? null,
    shift: a.shift,
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/activities", async (req, res): Promise<void> => {
  const params = ListActivitiesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];
  if (params.data.residentId) {
    conditions.push(eq(activitiesTable.residentId, params.data.residentId));
  }
  if (params.data.date) {
    conditions.push(eq(activitiesTable.date, params.data.date));
  }
  if (params.data.status) {
    conditions.push(eq(activitiesTable.status, params.data.status as "completed" | "pending" | "not_done"));
  }

  const activities = await db
    .select({
      activity: activitiesTable,
      residentName: residentsTable.name,
    })
    .from(activitiesTable)
    .leftJoin(residentsTable, eq(activitiesTable.residentId, residentsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(activitiesTable.date, activitiesTable.createdAt);

  res.json(ListActivitiesResponse.parse(
    activities.map(({ activity, residentName }) => mapActivity(activity, residentName ?? undefined))
  ));
});

router.post("/activities", async (req, res): Promise<void> => {
  const parsed = CreateActivityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [activity] = await db.insert(activitiesTable).values({
    residentId: parsed.data.residentId,
    type: parsed.data.type,
    date: parsed.data.date instanceof Date ? parsed.data.date.toISOString().split("T")[0] : String(parsed.data.date),
    time: parsed.data.time ?? null,
    status: "pending",
    shift: parsed.data.shift,
    observations: parsed.data.observations ?? null,
  }).returning();

  const [resident] = await db.select().from(residentsTable).where(eq(residentsTable.id, activity.residentId));
  res.status(201).json(mapActivity(activity, resident?.name));
});

router.patch("/activities/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

  const parsed = UpdateActivityBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [activity] = await db.update(activitiesTable)
    .set(parsed.data)
    .where(eq(activitiesTable.id, id))
    .returning();

  if (!activity) { res.status(404).json({ error: "Atividade não encontrada" }); return; }

  const [resident] = await db.select().from(residentsTable).where(eq(residentsTable.id, activity.residentId));
  res.json(UpdateActivityResponse.parse(mapActivity(activity, resident?.name)));
});

export default router;
