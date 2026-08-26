import { Router, Request, Response, NextFunction, RequestHandler } from "express";
import multer from "multer";
import { Readable } from "node:stream";
import { requireAuth } from "../middleware/auth";
import { getImage, putImage, UploadsError } from "../services/uploads.service";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }, // keep in sync with uploads.service
});

// @types/multer vendors its own @types/express versions; align them at the boundary
const uploadSingle = upload.single("file") as unknown as RequestHandler;

function handleUploadMiddleware(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (!err) {
    next();
    return;
  }
  if (err instanceof multer.MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    res.status(status).json({ error: "Image exceeds the 4MB limit" });
    return;
  }
  res.status(400).json({ error: err instanceof Error ? err.message : "Upload failed" });
}

router.post("/", requireAuth, uploadSingle, handleUploadMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }
    const uploaded = await putImage(req.file.buffer, req.file.mimetype);
    res.json({ pathname: uploaded.pathname, url: uploaded.url });
  } catch (err) {
    if (err instanceof UploadsError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/blob", requireAuth, async (req, res) => {
  try {
    const pathname = req.query.pathname;
    if (typeof pathname !== "string" || !pathname) {
      return res.status(400).json({ error: "Missing pathname" });
    }

    const result = await getImage(pathname);
    if (!result || !result.stream) {
      return res.status(404).send("Not found");
    }

    // res.send() cannot stream — it JSON-serializes objects; pipe instead
    res
      .status(200)
      .set({
        "Cache-Control": "private, no-cache",
        "Content-Type": result.blob.contentType ?? "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      });

    const nodeStream = Readable.fromWeb(result.stream);
    nodeStream.on("error", () => res.destroy());
    nodeStream.pipe(res);
  } catch (err) {
    if (err instanceof UploadsError) {
      return res.status(err.statusCode).send(err.message);
    }
    res.status(500).send("Internal server error");
  }
});

export default router;
