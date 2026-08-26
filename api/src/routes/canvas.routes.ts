import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import {
  CanvasError,
  listByTemplate,
  getById,
  create,
  update,
  remove,
} from "../services/canvas.service";

const router = Router({ mergeParams: true });

function handleError(res: Response, err: unknown) {
  if (err instanceof CanvasError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  res.status(500).json({ error: "Internal server error" });
}

router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    res.json({ canvases: await listByTemplate(templateId, req.user!.id) });
  } catch (err) {
    handleError(res, err);
  }
});

router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    res.status(201).json({ canvas: await create(templateId, req.user!.id) });
  } catch (err) {
    handleError(res, err);
  }
});

router.get("/:canvasId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { templateId, canvasId } = req.params;
    res.json({ canvas: await getById(canvasId, templateId, req.user!.id) });
  } catch (err) {
    handleError(res, err);
  }
});

router.put("/:canvasId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { templateId, canvasId } = req.params;
    res.json({
      canvas: await update(canvasId, templateId, req.user!.id, req.body ?? {}),
    });
  } catch (err) {
    handleError(res, err);
  }
});

router.delete("/:canvasId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { templateId, canvasId } = req.params;
    await remove(canvasId, templateId, req.user!.id);
    res.json({ ok: true });
  } catch (err) {
    handleError(res, err);
  }
});

export default router;
