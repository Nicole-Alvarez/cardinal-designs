import { Router, Request, Response } from "express";
import authRoutes from "./auth.routes";
import canvasRoutes from "./canvas.routes";
import templateRoutes from "./template.routes";
import uploadsRoutes from "./uploads.routes";

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

router.use("/auth", authRoutes);
router.use("/templates", templateRoutes);
router.use("/templates/:templateId/canvases", canvasRoutes);
router.use("/uploads", uploadsRoutes);

export default router;
