import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { config } from "../config";
import { requireAuth } from "../middleware/auth";
import { AuthError, login, logout, me, register } from "../services/auth.service";
import { getUserConfiguration } from "../services/user-configuration.service";

const router = Router();

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many registration attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

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

    res.json({ token: result.token, user: result.user });
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/register", registerLimiter, async (req: Request, res: Response) => {
  try {
    const { username, password, name } = req.body ?? {};
    const result = await register({ username, password, name });

    res.cookie(config.cookieName, result.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: config.sessionTtlMs,
    });

    res.status(201).json({ token: result.token, user: result.user });
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return res.status(409).json({ error: "Username already taken" });
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

router.get("/me/configuration", requireAuth, async (req: Request, res: Response) => {
  res.json({ configuration: await getUserConfiguration(req.user!.id) });
});

export default router;
