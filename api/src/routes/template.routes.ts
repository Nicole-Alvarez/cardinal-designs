import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import {
  TemplateError,
  create,
  getById,
  list,
  remove,
  update,
} from "../services/template.service";

const router = Router();

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
    res.status(201).json({ template: await create(req.user!.id) });
  } catch (err) {
    handleError(res, err);
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
