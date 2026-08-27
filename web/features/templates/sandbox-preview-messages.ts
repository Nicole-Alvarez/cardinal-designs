import type { CodeLang, TemplateMetadata } from "./types";
import type { RenderedPreviewImage } from "./image-export";

export type SandboxPreviewMode = Extract<CodeLang, "html" | "react">;

export interface SandboxRenderMessage {
  source: "cardinal-preview-parent";
  type: "render";
  channel: string;
  mode: SandboxPreviewMode;
  code: string;
  metadata: TemplateMetadata;
}

export interface SandboxExportMessage {
  source: "cardinal-preview-parent";
  type: "export";
  channel: string;
  requestId: string;
  target: "batch" | "cards";
  pixelRatio: number;
  allowFontFallback: boolean;
}

export type SandboxParentMessage = SandboxRenderMessage | SandboxExportMessage;

export type SandboxChildMessage =
  | {
      source: "cardinal-preview-frame";
      type: "ready";
      channel: string;
    }
  | {
      source: "cardinal-preview-frame";
      type: "height";
      channel: string;
      height: number;
    }
  | {
      source: "cardinal-preview-frame";
      type: "rendered";
      channel: string;
    }
  | {
      source: "cardinal-preview-frame";
      type: "error";
      channel: string;
      message: string;
    }
  | {
      source: "cardinal-preview-frame";
      type: "exported";
      channel: string;
      requestId: string;
      images: RenderedPreviewImage[];
    }
  | {
      source: "cardinal-preview-frame";
      type: "export-error";
      channel: string;
      requestId: string;
      message: string;
    };

export function isSandboxRenderMessage(
  value: unknown,
  channel: string
): value is SandboxRenderMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<SandboxRenderMessage>;
  return (
    message.source === "cardinal-preview-parent" &&
    message.type === "render" &&
    message.channel === channel &&
    (message.mode === "html" || message.mode === "react") &&
    typeof message.code === "string" &&
    Array.isArray(message.metadata)
  );
}

export function isSandboxParentMessage(
  value: unknown,
  channel: string
): value is SandboxParentMessage {
  if (isSandboxRenderMessage(value, channel)) return true;
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<SandboxExportMessage>;
  return (
    message.source === "cardinal-preview-parent" &&
    message.type === "export" &&
    message.channel === channel &&
    typeof message.requestId === "string" &&
    message.requestId.length > 0 &&
    (message.target === "batch" || message.target === "cards") &&
    typeof message.pixelRatio === "number" &&
    Number.isFinite(message.pixelRatio) &&
    message.pixelRatio > 0 &&
    message.pixelRatio <= 4 &&
    typeof message.allowFontFallback === "boolean"
  );
}

function isRenderedPreviewImage(value: unknown): value is RenderedPreviewImage {
  if (!value || typeof value !== "object") return false;
  const image = value as Partial<RenderedPreviewImage>;
  return (
    typeof image.dataUrl === "string" &&
    image.dataUrl.startsWith("data:image/png") &&
    image.dataUrl.length <= 50_000_000 &&
    typeof image.width === "number" &&
    Number.isFinite(image.width) &&
    image.width > 0 &&
    image.width <= 20_000 &&
    typeof image.height === "number" &&
    Number.isFinite(image.height) &&
    image.height > 0 &&
    image.height <= 20_000 &&
    typeof image.usedFallbackFonts === "boolean"
  );
}

export function isSandboxChildMessage(
  value: unknown,
  channel: string
): value is SandboxChildMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<SandboxChildMessage>;
  if (
    message.source !== "cardinal-preview-frame" ||
    message.channel !== channel
  ) {
    return false;
  }
  if (message.type === "ready" || message.type === "rendered") return true;
  if (message.type === "height") {
    return (
      typeof message.height === "number" &&
      Number.isFinite(message.height) &&
      message.height > 0
    );
  }
  if (message.type === "error") return typeof message.message === "string";
  if (message.type === "export-error") {
    return (
      typeof message.requestId === "string" &&
      typeof message.message === "string"
    );
  }
  if (message.type === "exported") {
    return (
      typeof message.requestId === "string" &&
      Array.isArray(message.images) &&
      message.images.length > 0 &&
      message.images.every(isRenderedPreviewImage)
    );
  }
  return false;
}
