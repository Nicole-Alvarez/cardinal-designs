import { NextFunction, Request, Response } from "express";
import { config } from "../config";
import prisma from "../prisma";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; username: string; name: string | null; role: string; status: string };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[config.cookieName];
  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return res.status(401).json({ error: "Session expired or invalid" });
  }

  req.user = {
    id: session.user.id,
    username: session.user.username,
    name: session.user.name,
    role: session.user.role,
    status: session.user.status,
  };

  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Administrator access is required", code: "ADMIN_REQUIRED" });
  next();
}
