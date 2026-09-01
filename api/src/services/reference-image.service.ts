import { imageSize } from "image-size";
import { UploadsError } from "./uploads.service";

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_PIXELS = 16_000_000;
const allowed = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);

export interface ReferenceImage {
  dataUrl: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  width: number;
  height: number;
}

export function validateReferenceImage(file: Pick<Express.Multer.File, "buffer" | "mimetype" | "originalname">): ReferenceImage {
  const extension = file.originalname.split(".").pop()?.toLowerCase();
  const expected = allowed.get(file.mimetype);
  if (!expected) throw new UploadsError("Reference images must be PNG, JPEG, or WebP", 415);
  if (file.buffer.byteLength === 0 || file.buffer.byteLength > MAX_BYTES) throw new UploadsError("Reference image exceeds the 4MB limit", 413);
  if (!extension || ![expected, expected === "jpg" ? "jpeg" : expected].includes(extension)) throw new UploadsError("Reference image extension does not match its type", 400);
  let dimensions: { width?: number; height?: number; type?: string };
  try { dimensions = imageSize(file.buffer); } catch { throw new UploadsError("Reference image is invalid or corrupted", 400); }
  if (!dimensions.width || !dimensions.height || dimensions.width * dimensions.height > MAX_PIXELS) throw new UploadsError("Reference image dimensions are invalid or too large", 400);
  if (dimensions.type !== expected) throw new UploadsError("Reference image content does not match its type", 400);
  return { dataUrl: `data:${file.mimetype};base64,${file.buffer.toString("base64")}`, mimeType: file.mimetype as ReferenceImage["mimeType"], width: dimensions.width, height: dimensions.height };
}
