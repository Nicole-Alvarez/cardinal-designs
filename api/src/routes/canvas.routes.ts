import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import {
  CanvasError,
  listByTemplate,
  getById,
  create,
  update,
  remove,
  setGeneratedImageSource,
} from "../services/canvas.service";
import { generateImageBlockAsset } from "../services/ai-image.service";
import { AiTemplateError } from "../services/ai-template.service";
import { requireUserFeature, UserConfigurationError } from "../services/user-configuration.service";

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

router.post("/:canvasId/ai-images/:blockId", requireAuth, async (req: Request, res: Response) => {
  try {
    await requireUserFeature(req.user!.id, "canUseGenerateAI");
    const { templateId, canvasId, blockId } = req.params;
    const canvas = await getById(canvasId, templateId, req.user!.id);
    const content = canvas.content && typeof canvas.content === "object" && !Array.isArray(canvas.content)
      ? canvas.content as { blocks?: unknown[] }
      : null;
    const block = content?.blocks?.find((item) => item && typeof item === "object" && !Array.isArray(item) && (item as { id?: unknown }).id === blockId);
    if (!block || typeof block !== "object" || Array.isArray(block)) throw new CanvasError("Image block not found", 404);
    if ((block as { type?: unknown }).type !== "image") throw new CanvasError("Block is not an image", 400);
    if (typeof (block as { src?: unknown }).src === "string" && (block as { src: string }).src) {
      throw new CanvasError("Image block already has an asset", 409);
    }
    const uploaded = await generateImageBlockAsset(block as never, req.body?.prompt);
    const updated = await setGeneratedImageSource(canvasId, templateId, req.user!.id, blockId, uploaded.url);
    res.json({ canvas: updated, url: uploaded.url });
  } catch (err) {
    if (err instanceof CanvasError || err instanceof AiTemplateError || err instanceof UserConfigurationError) return res.status(err.statusCode).json({ error: err.message });
    res.status(500).json({ error: "Internal server error" });
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
