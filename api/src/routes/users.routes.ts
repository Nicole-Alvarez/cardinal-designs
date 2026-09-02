import { Request, Response, Router } from "express";
import prisma from "../prisma";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { UserConfigurationError, getUserConfiguration, updateUserConfiguration } from "../services/user-configuration.service";

const router = Router();
const safeUser = { id: true, username: true, name: true, role: true, status: true, createdAt: true, updatedAt: true } as const;

router.get("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const users = await prisma.user.findMany({ where: query ? { OR: [{ username: { contains: query, mode: "insensitive" } }, { name: { contains: query, mode: "insensitive" } }] } : undefined, select: safeUser, orderBy: { createdAt: "desc" }, take: 50 });
  res.json({ users });
});
router.get("/:id", requireAuth, requireAdmin, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: safeUser });
  if (!user) return res.status(404).json({ error: "User not found" });
  const [configuration, templateCount] = await Promise.all([getUserConfiguration(user.id), prisma.template.count({ where: { userId: user.id } })]);
  res.json({ user, configuration, usage: { templateCount } });
});
router.put("/:id/configuration", requireAuth, requireAdmin, async (req, res) => {
  try { res.json({ configuration: await updateUserConfiguration(req.params.id, req.body?.version, req.body ?? {}) }); }
  catch (error) { if (error instanceof UserConfigurationError) return res.status(error.statusCode).json({ error: error.message, code: error.code }); throw error; }
});
export default router;
