import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

const router: IRouter = Router();

type UserRole = "nurse" | "caregiver" | "manager";
type UserShift = "morning" | "afternoon" | "night";

const VALID_ROLES: UserRole[] = ["nurse", "caregiver", "manager"];
const VALID_SHIFTS: UserShift[] = ["morning", "afternoon", "night"];

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    shift: user.shift ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

router.get("/users", async (req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.name);
  res.json(users.map(formatUser));
});

router.post("/users", async (req, res): Promise<void> => {
  const { name, email, password, role, shift } = req.body ?? {};

  if (!name || !email || !password || !role) {
    res.status(400).json({ error: "Campos obrigatórios: name, email, password, role" });
    return;
  }
  if (!VALID_ROLES.includes(role)) {
    res.status(400).json({ error: "Função inválida" });
    return;
  }
  if (shift && !VALID_SHIFTS.includes(shift)) {
    res.status(400).json({ error: "Turno inválido" });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    res.status(409).json({ error: "E-mail já cadastrado" });
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({ name, email, passwordHash: password, role, shift: shift ?? null })
    .returning();

  res.status(201).json(formatUser(user));
});

router.put("/users/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const { name, email, password, role, shift } = req.body ?? {};

  if (role && !VALID_ROLES.includes(role)) {
    res.status(400).json({ error: "Função inválida" }); return;
  }
  if (shift && !VALID_SHIFTS.includes(shift)) {
    res.status(400).json({ error: "Turno inválido" }); return;
  }

  const updates: Record<string, unknown> = {};
  if (name) updates.name = name;
  if (email) updates.email = email;
  if (password) updates.passwordHash = password;
  if (role) updates.role = role;
  if ("shift" in req.body) updates.shift = shift ?? null;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Nenhum campo para atualizar" }); return;
  }

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "Usuário não encontrado" }); return; }

  res.json(formatUser(user));
});

router.delete("/users/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.status(204).send();
});

export default router;
