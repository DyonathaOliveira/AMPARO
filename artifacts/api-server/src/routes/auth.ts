import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { LoginBody, LoginResponse, GetCurrentUserResponse } from "@workspace/api-zod";

const router: IRouter = Router();

// Simple session store (in-memory for this implementation)
const sessions = new Map<string, number>();

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (!user || user.passwordHash !== password) {
    res.status(401).json({ error: "E-mail ou senha inválidos" });
    return;
  }

  const token = generateToken();
  sessions.set(token, user.id);

  const response = LoginResponse.parse({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      shift: user.shift ?? null,
      createdAt: user.createdAt.toISOString(),
    },
    token,
  });

  res.json(response);
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    sessions.delete(token);
  }
  res.json({ success: true });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  const userId = sessions.get(token);

  if (!userId) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(GetCurrentUserResponse.parse({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    shift: user.shift ?? null,
    createdAt: user.createdAt.toISOString(),
  }));
});

export { sessions };
export default router;
