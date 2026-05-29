import { Router, type IRouter } from "express";
import { eq, and, gte, lte, count } from "drizzle-orm";
import { db, medicationsTable, activitiesTable, appointmentsTable, alertsTable, residentsTable, medicationAdministrationsTable } from "@workspace/db";
import { GetShiftReportQueryParams, GetShiftReportResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/reports/shift", async (req, res): Promise<void> => {
  const params = GetShiftReportQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const startDate = params.data.startDate ?? today;
  const endDate = params.data.endDate ?? today;

  const activityConditions = [
    gte(activitiesTable.date, startDate),
    lte(activitiesTable.date, endDate),
  ];
  if (params.data.shift) {
    activityConditions.push(eq(activitiesTable.shift, params.data.shift as "morning" | "afternoon" | "night"));
  }
  if (params.data.residentId) {
    activityConditions.push(eq(activitiesTable.residentId, params.data.residentId));
  }

  const activities = await db
    .select({ activity: activitiesTable, residentName: residentsTable.name })
    .from(activitiesTable)
    .leftJoin(residentsTable, eq(activitiesTable.residentId, residentsTable.id))
    .where(and(...activityConditions));

  const aptConditions = [
    gte(appointmentsTable.date, startDate),
    lte(appointmentsTable.date, endDate),
  ];
  if (params.data.residentId) {
    aptConditions.push(eq(appointmentsTable.residentId, params.data.residentId));
  }

  const appointments = await db
    .select({ appointment: appointmentsTable, residentName: residentsTable.name })
    .from(appointmentsTable)
    .leftJoin(residentsTable, eq(appointmentsTable.residentId, residentsTable.id))
    .where(and(...aptConditions));

  const medConditions: ReturnType<typeof eq>[] = [];
  if (params.data.residentId) {
    medConditions.push(eq(medicationsTable.residentId, params.data.residentId));
  }

  const medications = await db
    .select({ medication: medicationsTable, residentName: residentsTable.name })
    .from(medicationsTable)
    .leftJoin(residentsTable, eq(medicationsTable.residentId, residentsTable.id))
    .where(medConditions.length > 0 ? and(...medConditions) : undefined);

  const [totalResidentsResult] = await db
    .select({ count: count() })
    .from(residentsTable)
    .where(eq(residentsTable.status, "active"));

  const activityTypeLabels: Record<string, string> = {
    bath: "Banho",
    feeding: "Alimentação",
    hygiene: "Higiene",
    physiotherapy: "Fisioterapia",
    medication: "Medicação",
    other: "Outra",
  };

  const details = [
    ...activities.map(({ activity, residentName }) => ({
      type: `Atividade: ${activityTypeLabels[activity.type] ?? activity.type}`,
      residentName: residentName ?? "N/A",
      description: `Status: ${activity.status}${activity.observations ? ` — ${activity.observations}` : ""}`,
      timestamp: activity.createdAt.toISOString(),
      responsibleUser: null,
    })),
    ...appointments.map(({ appointment, residentName }) => ({
      type: "Consulta",
      residentName: residentName ?? "N/A",
      description: `${appointment.specialty} — ${appointment.status}`,
      timestamp: appointment.createdAt.toISOString(),
      responsibleUser: null,
    })),
    ...medications.map(({ medication, residentName }) => ({
      type: "Medicamento",
      residentName: residentName ?? "N/A",
      description: `${medication.name} ${medication.dose} — ${medication.status}`,
      timestamp: medication.createdAt.toISOString(),
      responsibleUser: null,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const completedActivities = activities.filter(a => a.activity.status === "completed").length;
  const pendingActivities = activities.filter(a => a.activity.status === "pending").length;
  const administeredMeds = medications.filter(m => m.medication.status === "administered").length;
  const pendingMeds = medications.filter(m => m.medication.status === "pending").length;
  const lateMeds = medications.filter(m => m.medication.status === "late").length;
  const completedApts = appointments.filter(a => a.appointment.status === "completed").length;
  const cancelledApts = appointments.filter(a => a.appointment.status === "cancelled").length;

  res.json(GetShiftReportResponse.parse({
    period: `${startDate} a ${endDate}`,
    totalResidents: totalResidentsResult.count,
    medicationsAdministered: administeredMeds,
    medicationsPending: pendingMeds,
    medicationsLate: lateMeds,
    activitiesCompleted: completedActivities,
    activitiesPending: pendingActivities,
    appointmentsHeld: completedApts,
    appointmentsCancelled: cancelledApts,
    alerts: 0,
    details,
  }));
});

export default router;
