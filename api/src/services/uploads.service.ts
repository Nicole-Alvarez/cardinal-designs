import { get, put } from "@vercel/blob";
import { config } from "../config";

export class UploadsError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB — also Vercel serverless body limit territory

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

const PATHNAME_PATTERN =
  /^templates\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp|gif)$/;

export interface UploadedImage {
  pathname: string;
  url: string;
  contentType: string;
}

function ensureBlobToken() {
  if (!config.blobToken) {
    throw new UploadsError("BLOB_READ_WRITE_TOKEN is not configured", 500);
  }
}

function ensurePublicBlobToken() {
  if (!config.publicBlobToken) {
    throw new UploadsError("PUBLIC_BLOB_READ_WRITE_TOKEN is not configured", 500);
  }
}

/** Stores a template image as a public-by-link blob under a generated pathname. */
export async function putImage(
  buffer: Buffer,
  mimeType: string
): Promise<UploadedImage> {
  ensurePublicBlobToken();

  const ext = MIME_TO_EXT[mimeType];
  if (!ext) {
    throw new UploadsError("Unsupported image type", 415);
  }
  if (buffer.byteLength === 0) {
    throw new UploadsError("Empty file");
  }
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new UploadsError("Image exceeds the 4MB limit", 413);
  }

  const pathname = `templates/${crypto.randomUUID()}.${ext}`;
  const blob = await put(pathname, buffer, {
    access: "public",
    addRandomSuffix: true,
    contentType: mimeType,
    token: config.publicBlobToken,
  });

  return { pathname: blob.pathname, url: blob.url, contentType: mimeType };
}

/**
 * Fetches a legacy private image stored before public-by-link uploads.
 * The pathname pattern check is the security boundary — it prevents
 * reading arbitrary paths in the blob store.
 */
export async function getImage(pathname: string) {
  ensureBlobToken();

  if (!PATHNAME_PATTERN.test(pathname)) {
    throw new UploadsError("Invalid pathname", 400);
  }

  return get(pathname, { access: "private" });
}
