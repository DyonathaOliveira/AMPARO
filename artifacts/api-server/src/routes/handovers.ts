import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, handoversTable } from "@workspace/db";
import {
  ListHandoversResponse,
  CreateHandoverBody,
  GetLatestHandoverResponse,
  ConfirmHandoverReadParams,
  ConfirmHandoverReadResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseId(raw: unknown): number | null {
  const id = parseInt(String(raw), 10);
  return isNaN(id) ? null : id;
}

function mapHandover(h: typeof handoversTable.$inferSelect) {
  return {
    id: h.id,
    shift: h.shift,
    date: h.date,
    createdBy: h.createdBy,
    occurrences: h.occurrences,
    pendencies: h.pendencies ?? null,
    isRead: h.isRead,
    readBy: h.readBy ?? null,
    readAt: h.readAt?.toISOString() ?? null,
    createdAt: h.createdAt.toISOString(),
  };
}

router.get("/handovers", async (req, res): Promise<void> => {
  const handovers = await db.select().from(handoversTable).orderBy(desc(handoversTable.createdAt));
  res.json(ListHandoversResponse.parse(handovers.map(mapHandover)));
});

router.post("/handovers", async (req, res): Promise<void> => {
  const parsed = CreateHandoverBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const [handover] = await db.insert(handoversTable).values({
    shift: parsed.data.shift,
    date: today,
    createdBy: parsed.data.createdBy ?? "Sistema",
    occurrences: parsed.data.occurrences,
    pendencies: parsed.data.pendencies ?? null,
    isRead: false,
  }).returning();

  res.status(201).json(mapHandover(handover));
});

router.get("/handovers/latest", async (req, res): Promise<void> => {
  const [handover] = await db.select().from(handoversTable)
    .orderBy(desc(handoversTable.createdAt))
    .limit(1);

  if (!handover) {
    res.status(404).json({ error: "Nenhuma passagem de plantão encontrada" });
    return;
  }

  res.json(GetLatestHandoverResponse.parse(mapHandover(handover)));
});

router.post("/handovers/:id/confirm", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

  const readBy = (req.body as { readBy?: string }).readBy ?? "Usuário";
  const [handover] = await db.update(handoversTable)
    .set({ isRead: true, readBy, readAt: new Date() })
    .where(eq(handoversTable.id, id))
    .returning();

  if (!handover) { res.status(404).json({ error: "Passagem não encontrada" }); return; }

  res.json(ConfirmHandoverReadResponse.parse(mapHandover(handover)));
});

export default router;
