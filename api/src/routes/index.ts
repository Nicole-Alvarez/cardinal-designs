import { Router, Request, Response } from "express";
import authRoutes from "./auth.routes";
import templateRoutes from "./template.routes";

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

router.use("/auth", authRoutes);
router.use("/templates", templateRoutes);

export default router;
