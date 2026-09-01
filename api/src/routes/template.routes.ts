import { Router, Request, Response, NextFunction, RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { requireAuth } from "../middleware/auth";
import { AiTemplateError, createAiLayout, createAiReferenceLayout } from "../services/ai-template.service";
import { validateReferenceImage } from "../services/reference-image.service";
import { UploadsError } from "../services/uploads.service";
import {
  TemplateError,
  create,
  getById,
  list,
  remove,
  update,
} from "../services/template.service";

const router = Router();

const aiCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id ?? req.ip ?? "unknown",
  message: { error: "Too many AI Create requests, please try again later" },
});
const referenceUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024 } });
// @types/multer vendors its own @types/express versions; align them at the boundary.
const referenceUploadSingle = referenceUpload.single("reference") as unknown as RequestHandler;

function handleReferenceUploadMiddleware(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (!err) return next();
  if (err instanceof multer.MulterError) {
    return res.status(err.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ error: "Reference image exceeds the 4MB limit" });
  }
  return res.status(400).json({ error: err instanceof Error ? err.message : "Reference upload failed" });
}

function handleError(res: Response, err: unknown) {
  if (err instanceof TemplateError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  res.status(500).json({ error: "Internal server error" });
}

router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    res.json({ templates: await list(req.user!.id) });
  } catch (err) {
    handleError(res, err);
  }
});

router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    res.status(201).json({ template: await create(req.user!.id, req.body) });
  } catch (err) {
    handleError(res, err);
  }
});

router.post("/ai-create", requireAuth, aiCreateLimiter, async (req: Request, res: Response) => {
  try {
    const { prompt, canvas } = req.body ?? {};
    res.json({ content: await createAiLayout(prompt, canvas) });
  } catch (err) {
    if (err instanceof AiTemplateError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/ai-create/reference", requireAuth, aiCreateLimiter, referenceUploadSingle, handleReferenceUploadMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: "A reference image is required" });
    const canvas = typeof req.body?.canvas === "string" ? JSON.parse(req.body.canvas) : null;
    const reference = validateReferenceImage(req.file);
    res.json({ content: await createAiReferenceLayout(req.body?.prompt ?? "", canvas, reference, req.body?.mode) });
  } catch (err) {
    if (err instanceof SyntaxError) return res.status(400).json({ error: "Canvas is invalid" });
    if (err instanceof UploadsError || err instanceof AiTemplateError) return res.status(err.statusCode).json({ error: err.message });
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    res.json({ template: await getById(req.params.id, req.user!.id) });
  } catch (err) {
    handleError(res, err);
  }
});

router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    res.json({ template: await update(req.params.id, req.user!.id, req.body ?? {}) });
  } catch (err) {
    handleError(res, err);
  }
});

router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    await remove(req.params.id, req.user!.id);
    res.json({ ok: true });
  } catch (err) {
    handleError(res, err);
  }
});

export default router;
