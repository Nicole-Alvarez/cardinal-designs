import { config } from "../config";
import type { ReferenceImage } from "./reference-image.service";

const MAX_PROMPT_LENGTH = 2_000;
const MAX_BLOCKS = 25;
const MIN_BLOCK_SIZE = 16;
const DEFAULT_ICON = "star";

export const AI_CREATE_LIMITS = {
  maxPromptLength: MAX_PROMPT_LENGTH,
  maxBlocks: MAX_BLOCKS,
} as const;

export class AiTemplateError extends Error {
  constructor(message: string, public statusCode = 400) {
    super(message);
  }
}

export interface AiCanvasInput {
  width: string;
  height: string;
  backgroundColor: string;
  textColor: string;
  overlayImage: string;
  overlayFit: "cover" | "contain";
  overlayOpacity: number;
  overlayMargin: number;
  overlayPadding: number;
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
}

export interface AiBlockStyle {
  color: string;
  backgroundColor: string;
  fontSize: number;
  fontWeight: number;
  fontFamily?: string;
  italic?: boolean;
  underline?: boolean;
  textAlign: "left" | "center" | "right";
  padding: number;
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
}

export interface AiTemplateBlock {
  id: string;
  type: "heading" | "text" | "button" | "image" | "icon" | "qr" | "barcode";
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  text?: string;
  level?: 1 | 2 | 3;
  href?: string;
  src?: string;
  alt?: string;
  icon?: string;
  style: AiBlockStyle;
}

export interface AiTemplateContent {
  version: 4;
  canvas: AiCanvasInput;
  blocks: AiTemplateBlock[];
  metadata: [];
}

type RawObject = Record<string, unknown>;

const BLOCK_TYPES = new Set<AiTemplateBlock["type"]>([
  "heading", "text", "button", "image", "icon", "qr", "barcode",
]);

const defaultStyle = (): AiBlockStyle => ({
  color: "inherit",
  backgroundColor: "transparent",
  fontSize: 16,
  fontWeight: 400,
  textAlign: "left",
  padding: 8,
  borderWidth: 0,
  borderColor: "#d4d4d8",
  borderRadius: 0,
});

function canvasDimension(value: string, fallback: number): number {
  if (value === "auto") return fallback;
  const match = /^(\d+(?:\.\d+)?)px$/.exec(value);
  return match ? Math.max(MIN_BLOCK_SIZE, Math.round(Number(match[1]))) : fallback;
}

function asFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function integerInRange(value: unknown, fallback: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, Math.round(asFiniteNumber(value, fallback))));
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim().slice(0, 500) : fallback;
}

function isSafeColor(value: unknown, fallback: string): string {
  if (value === "inherit" || value === "transparent") return value;
  if (typeof value === "string" && /^#[0-9a-f]{3,8}$/i.test(value)) return value;
  return fallback;
}

function normalizeStyle(raw: unknown): AiBlockStyle {
  const value = raw && typeof raw === "object" ? raw as RawObject : {};
  const textAlign = value.textAlign;
  const style: AiBlockStyle = {
    color: isSafeColor(value.color, "inherit"),
    backgroundColor: isSafeColor(value.backgroundColor, "transparent"),
    fontSize: integerInRange(value.fontSize, 16, 8, 96),
    fontWeight: integerInRange(value.fontWeight, 400, 100, 900),
    textAlign: textAlign === "center" || textAlign === "right" ? textAlign : "left",
    padding: integerInRange(value.padding, 8, 0, 64),
    borderWidth: integerInRange(value.borderWidth, 0, 0, 16),
    borderColor: isSafeColor(value.borderColor, "#d4d4d8"),
    borderRadius: integerInRange(value.borderRadius, 0, 0, 128),
  };
  if (typeof value.fontFamily === "string" && value.fontFamily.length <= 160) {
    style.fontFamily = value.fontFamily;
  }
  if (typeof value.italic === "boolean") style.italic = value.italic;
  if (typeof value.underline === "boolean") style.underline = value.underline;
  return style;
}

function safeHref(value: unknown): string {
  const href = text(value, "#");
  return href === "#" || href.startsWith("/") || /^https:\/\//i.test(href) ? href : "#";
}

function rawBlocks(raw: unknown): RawObject[] {
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as RawObject).blocks)) {
    throw new AiTemplateError("AI response did not contain blocks", 502);
  }
  const blocks = (raw as RawObject).blocks as unknown[];
  if (blocks.length > MAX_BLOCKS) throw new AiTemplateError(`AI layouts may contain at most ${MAX_BLOCKS} blocks`, 502);
  return blocks.map((block) => {
    if (!block || typeof block !== "object" || Array.isArray(block)) {
      throw new AiTemplateError("AI response contains an invalid block", 502);
    }
    return block as RawObject;
  });
}

/** Converts untrusted model JSON into the editor's editable v4 content model. */
export function normalizeAiLayout(canvas: AiCanvasInput, raw: unknown): AiTemplateContent {
  const width = canvasDimension(canvas.width, 480);
  const height = canvasDimension(canvas.height, 384);
  const blocks = rawBlocks(raw).map((source, index) => {
    if (!BLOCK_TYPES.has(source.type as AiTemplateBlock["type"])) {
      throw new AiTemplateError("AI response contains an unsupported block type", 502);
    }
    const type = source.type as AiTemplateBlock["type"];
    const blockWidth = integerInRange(source.width, type === "icon" || type === "qr" ? 120 : 200, MIN_BLOCK_SIZE, width);
    const blockHeight = type === "icon" || type === "qr"
      ? blockWidth
      : integerInRange(source.height, type === "barcode" ? 80 : 44, MIN_BLOCK_SIZE, height);
    const block: AiTemplateBlock = {
      id: crypto.randomUUID(),
      type,
      x: integerInRange(source.x, 0, 0, Math.max(0, width - blockWidth)),
      y: integerInRange(source.y, 0, 0, Math.max(0, height - blockHeight)),
      width: blockWidth,
      height: blockHeight,
      z: index,
      style: normalizeStyle(source.style),
    };

    if (type === "heading" || type === "text" || type === "button" || type === "qr" || type === "barcode") {
      block.text = text(source.text, type === "heading" ? "Heading" : type === "button" ? "Action" : "");
    }
    if (type === "heading") block.level = source.level === 1 || source.level === 3 ? source.level : 2;
    if (type === "button") block.href = safeHref(source.href);
    if (type === "image") {
      block.src = "";
      block.alt = text(source.alt, "Upload an image");
    }
    if (type === "icon") block.icon = DEFAULT_ICON;
    return block;
  });

  return { version: 4, canvas, blocks, metadata: [] };
}

function requireOpenAiKey(): string {
  if (!config.openAiApiKey) throw new AiTemplateError("AI Create is not configured", 503);
  return config.openAiApiKey;
}

export function openAiErrorDetails(endpoint: string, response: Response, data: unknown) {
  const error = data && typeof data === "object" && "error" in data
    ? (data as { error?: Record<string, unknown> }).error
    : undefined;
  return {
    endpoint,
    status: response.status,
    requestId: response.headers.get("x-request-id") ?? undefined,
    type: typeof error?.type === "string" ? error.type : undefined,
    code: typeof error?.code === "string" ? error.code : undefined,
    message: typeof error?.message === "string" ? error.message : undefined,
  };
}

export function retryAfterSeconds(response: Response): number | null {
  const value = response.headers.get("retry-after")?.trim();
  if (!value || !/^\d+$/.test(value)) return null;
  const seconds = Number(value);
  return Number.isSafeInteger(seconds) && seconds > 0 && seconds <= 60 ? seconds : null;
}

async function openAiJson(path: string, body: unknown): Promise<unknown> {
  const response = await fetch(`https://api.openai.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requireOpenAiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    console.error("OpenAI AI Create request failed", openAiErrorDetails(path, response, data));
    if (response.status === 429) {
      const retryAfter = retryAfterSeconds(response);
      throw new AiTemplateError(
        retryAfter ? `OpenAI is rate limited. Try again in ${retryAfter} seconds.` : "OpenAI is rate limited. Try again shortly.",
        429
      );
    }
    throw new AiTemplateError("AI Create is temporarily unavailable", 502);
  }
  return data;
}

export const AI_LAYOUT_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["blocks"],
  properties: {
    blocks: {
      type: "array",
      maxItems: MAX_BLOCKS,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "x", "y", "width", "height", "text", "alt", "href", "level", "style"],
        properties: {
          type: { type: "string", enum: [...BLOCK_TYPES] },
          x: { type: "number" }, y: { type: "number" }, width: { type: "number" }, height: { type: "number" },
          text: { type: ["string", "null"] }, alt: { type: ["string", "null"] }, href: { type: ["string", "null"] }, level: { type: ["number", "null"] },
          style: {
            type: "object",
            additionalProperties: false,
            required: ["color", "backgroundColor", "fontSize", "fontWeight", "fontFamily", "italic", "underline", "textAlign", "padding", "borderWidth", "borderColor", "borderRadius"],
            properties: {
              color: { type: "string" },
              backgroundColor: { type: "string" },
              fontSize: { type: "number" },
              fontWeight: { type: "number" },
              fontFamily: { type: ["string", "null"] },
              italic: { type: ["boolean", "null"] },
              underline: { type: ["boolean", "null"] },
              textAlign: { type: "string", enum: ["left", "center", "right"] },
              padding: { type: "number" },
              borderWidth: { type: "number" },
              borderColor: { type: "string" },
              borderRadius: { type: "number" },
            },
          },
        },
      },
    },
  },
};

async function moderate(prompt: string, reference?: ReferenceImage) {
  const input = reference
    ? [{ type: "text", text: prompt || "Analyze this user-provided card reference." }, { type: "image_url", image_url: { url: reference.dataUrl } }]
    : prompt;
  const result = await openAiJson("/moderations", { model: "omni-moderation-latest", input }) as { results?: Array<{ flagged?: boolean }> };
  if (result.results?.[0]?.flagged) throw new AiTemplateError("This request cannot be used to create a template", 422);
}

export async function createAiReferenceLayout(
  prompt: unknown,
  canvas: unknown,
  reference: ReferenceImage,
  mode: unknown,
): Promise<AiTemplateContent> {
  if (typeof prompt !== "string") throw new AiTemplateError("Prompt must be a string");
  if (prompt.length > MAX_PROMPT_LENGTH) throw new AiTemplateError(`Prompt must be ${MAX_PROMPT_LENGTH} characters or fewer`);
  if (!canvas || typeof canvas !== "object") throw new AiTemplateError("A canvas is required");
  const matchClosely = mode !== "inspiration";
  const trustedCanvas = canvas as AiCanvasInput;
  await moderate(prompt.trim(), reference);
  const response = await openAiJson("/responses", {
    model: "gpt-5.4-mini",
    store: false,
    input: [{ role: "user", content: [
      { type: "input_text", text: `Reconstruct this reference as editable card blocks for a ${trustedCanvas.width} by ${trustedCanvas.height} canvas. ${matchClosely ? "Match layout and hierarchy as closely as supported." : "Use the reference as visual inspiration."} Text must be separate editable text blocks. Use empty image blocks with alt text for photos/logos that cannot be recreated natively. ${prompt.trim()}` },
      { type: "input_image", image_url: reference.dataUrl, detail: "high" },
    ] }],
    text: { format: { type: "json_schema", name: "card_layout", strict: true, schema: AI_LAYOUT_RESPONSE_SCHEMA } },
  }) as { output_text?: unknown };
  if (typeof response.output_text !== "string") throw new AiTemplateError("AI Create returned no layout", 502);
  try { return normalizeAiLayout(trustedCanvas, JSON.parse(response.output_text)); }
  catch (error) { if (error instanceof AiTemplateError) throw error; throw new AiTemplateError("AI Create returned an invalid layout", 502); }
}

export async function createAiLayout(prompt: unknown, canvas: unknown): Promise<AiTemplateContent> {
  if (typeof prompt !== "string" || !prompt.trim()) throw new AiTemplateError("Describe the card you want to create");
  if (prompt.length > MAX_PROMPT_LENGTH) throw new AiTemplateError(`Prompt must be ${MAX_PROMPT_LENGTH} characters or fewer`);
  if (!canvas || typeof canvas !== "object") throw new AiTemplateError("A canvas is required");

  const trustedCanvas = canvas as AiCanvasInput;
  await moderate(prompt.trim());
  const response = await openAiJson("/responses", {
    model: "gpt-5.4-mini",
    input: [
      {
        role: "system",
        content: "Create an editable card layout. Return only blocks supported by the schema. Keep all blocks within the supplied canvas. Do not use images URLs; use image blocks with descriptive alt text when imagery is requested. Use concise, editable text.",
      },
      { role: "user", content: `Canvas: ${trustedCanvas.width} by ${trustedCanvas.height}. Request: ${prompt.trim()}` },
    ],
    text: { format: { type: "json_schema", name: "card_layout", strict: true, schema: AI_LAYOUT_RESPONSE_SCHEMA } },
  }) as { output_text?: unknown };

  if (typeof response.output_text !== "string") throw new AiTemplateError("AI Create returned no layout", 502);
  try {
    return normalizeAiLayout(trustedCanvas, JSON.parse(response.output_text));
  } catch (error) {
    if (error instanceof AiTemplateError) throw error;
    throw new AiTemplateError("AI Create returned an invalid layout", 502);
  }
}
