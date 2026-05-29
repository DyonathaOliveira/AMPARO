import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, alertsTable, residentsTable } from "@workspace/db";
import {
  ListAlertsQueryParams,
  ListAlertsResponse,
  ResolveAlertParams,
  ResolveAlertResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseId(raw: unknown): number | null {
  const id = parseInt(String(raw), 10);
  return isNaN(id) ? null : id;
}

function mapAlert(a: typeof alertsTable.$inferSelect, residentName?: string) {
  return {
    id: a.id,
    type: a.type,
    title: a.title,
    message: a.message,
    severity: a.severity,
    resolved: a.resolved,
    residentId: a.residentId ?? null,
    residentName: residentName ?? null,
    createdAt: a.createdAt.toISOString(),
    resolvedAt: a.resolvedAt?.toISOString() ?? null,
  };
}

router.get("/alerts", async (req, res): Promise<void> => {
  const params = ListAlertsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];
  if (params.data.type) {
    conditions.push(eq(alertsTable.type, params.data.type as "medication" | "activity" | "appointment" | "incident"));
  }
  if (params.data.resolved !== undefined) {
    conditions.push(eq(alertsTable.resolved, params.data.resolved));
  }

  const alerts = await db
    .select({
      alert: alertsTable,
      residentName: residentsTable.name,
    })
    .from(alertsTable)
    .leftJoin(residentsTable, eq(alertsTable.residentId, residentsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(alertsTable.createdAt);

  res.json(ListAlertsResponse.parse(
    alerts.map(({ alert, residentName }) => mapAlert(alert, residentName ?? undefined))
  ));
});

router.post("/alerts/:id/resolve", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [alert] = await db.update(alertsTable)
    .set({ resolved: true, resolvedAt: new Date() })
    .where(eq(alertsTable.id, id))
    .returning();

  if (!alert) { res.status(404).json({ error: "Alerta não encontrado" }); return; }

  const residentName = alert.residentId
    ? (await db.select({ name: residentsTable.name }).from(residentsTable).where(eq(residentsTable.id, alert.residentId)))[0]?.name
    : undefined;

  res.json(ResolveAlertResponse.parse(mapAlert(alert, residentName)));
});

export default router;
