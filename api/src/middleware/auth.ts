import { NextFunction, Request, Response } from "express";
import { config } from "../config";
import prisma from "../prisma";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; username: string; name: string | null };
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
  };

  next();
}
