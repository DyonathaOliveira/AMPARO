import { Router, type IRouter } from "express";
import { eq, and, gte, lte, count } from "drizzle-orm";
import { db, residentsTable, medicationsTable, activitiesTable, appointmentsTable, alertsTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetDashboardAlertsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];

  const [totalResidentsResult] = await db
    .select({ count: count() })
    .from(residentsTable)
    .where(eq(residentsTable.status, "active"));

  const [pendingMedsResult] = await db
    .select({ count: count() })
    .from(medicationsTable)
    .where(eq(medicationsTable.status, "pending"));

  const [lateMedsResult] = await db
    .select({ count: count() })
    .from(medicationsTable)
    .where(eq(medicationsTable.status, "late"));

  const [administeredMedsResult] = await db
    .select({ count: count() })
    .from(medicationsTable)
    .where(eq(medicationsTable.status, "administered"));

  const [openActivitiesResult] = await db
    .select({ count: count() })
    .from(activitiesTable)
    .where(and(eq(activitiesTable.status, "pending"), eq(activitiesTable.date, today)));

  const [todayApptsResult] = await db
    .select({ count: count() })
    .from(appointmentsTable)
    .where(eq(appointmentsTable.date, today));

  const [lateAlertsResult] = await db
    .select({ count: count() })
    .from(alertsTable)
    .where(eq(alertsTable.resolved, false));

  // Recent activity feed from medications + activities (last 10)
  const recentMeds = await db
    .select({
      id: medicationsTable.id,
      name: medicationsTable.name,
      status: medicationsTable.status,
      createdAt: medicationsTable.createdAt,
      residentName: residentsTable.name,
    })
    .from(medicationsTable)
    .leftJoin(residentsTable, eq(medicationsTable.residentId, residentsTable.id))
    .where(eq(medicationsTable.status, "administered"))
    .orderBy(medicationsTable.createdAt)
    .limit(5);

  const recentActivities = await db
    .select({
      id: activitiesTable.id,
      type: activitiesTable.type,
      status: activitiesTable.status,
      createdAt: activitiesTable.createdAt,
      residentName: residentsTable.name,
    })
    .from(activitiesTable)
    .leftJoin(residentsTable, eq(activitiesTable.residentId, residentsTable.id))
    .where(eq(activitiesTable.status, "completed"))
    .orderBy(activitiesTable.createdAt)
    .limit(5);

  const activityTypeLabels: Record<string, string> = {
    bath: "Banho",
    feeding: "Alimentação",
    hygiene: "Higiene",
    physiotherapy: "Fisioterapia",
    medication: "Medicação",
    other: "Outra atividade",
  };

  const recentActivity = [
    ...recentMeds.map(m => ({
      id: m.id,
      type: "medication",
      description: `Medicação administrada: ${m.name}`,
      time: m.createdAt.toISOString(),
      residentName: m.residentName ?? null,
    })),
    ...recentActivities.map(a => ({
      id: a.id + 1000,
      type: "activity",
      description: `${activityTypeLabels[a.type] ?? a.type} realizado`,
      time: a.createdAt.toISOString(),
      residentName: a.residentName ?? null,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);

  res.json(GetDashboardSummaryResponse.parse({
    totalResidents: totalResidentsResult.count,
    pendingMedications: pendingMedsResult.count,
    openActivities: openActivitiesResult.count,
    todayAppointments: todayApptsResult.count,
    lateAlerts: lateAlertsResult.count,
    recentActivity,
    medicationStats: {
      administered: administeredMedsResult.count,
      pending: pendingMedsResult.count,
      late: lateMedsResult.count,
    },
  }));
});

router.get("/dashboard/alerts", async (req, res): Promise<void> => {
  const alerts = await db
    .select({
      alert: alertsTable,
      residentName: residentsTable.name,
    })
    .from(alertsTable)
    .leftJoin(residentsTable, eq(alertsTable.residentId, residentsTable.id))
    .where(eq(alertsTable.resolved, false))
    .orderBy(alertsTable.createdAt)
    .limit(10);

  res.json(GetDashboardAlertsResponse.parse(
    alerts.map(({ alert, residentName }) => ({
      id: alert.id,
      type: alert.type,
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      resolved: alert.resolved,
      residentId: alert.residentId ?? null,
      residentName: residentName ?? null,
      createdAt: alert.createdAt.toISOString(),
      resolvedAt: alert.resolvedAt?.toISOString() ?? null,
    }))
  ));
});

export default router;
