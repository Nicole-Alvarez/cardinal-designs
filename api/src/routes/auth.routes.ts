import { Router, Request, Response } from "express";
import { config } from "../config";
import { requireAuth } from "../middleware/auth";
import { AuthError, login, logout, me } from "../services/auth.service";

const router = Router();

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body ?? {};
    const result = await login({ username, password });

    res.cookie(config.cookieName, result.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: config.sessionTtlMs,
    });

    res.json({ user: result.user });
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/logout", async (req: Request, res: Response) => {
  await logout(req.cookies?.[config.cookieName]);
  res.clearCookie(config.cookieName);
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await me(req.user!.id);
    res.json({ user });
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
