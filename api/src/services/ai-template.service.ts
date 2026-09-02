import { config } from "../config";
import {
  buildAiGenerationSystemPrompt,
  formatAiUserRequest,
  MAX_AI_BLOCKS,
  MAX_AI_IMAGE_BLOCKS,
} from "./ai-prompt-builder";
import type { ReferenceImage } from "./reference-image.service";

const MAX_PROMPT_LENGTH = 2_000;
const MIN_BLOCK_SIZE = 16;
const DEFAULT_ICON = "star";

export const AI_CREATE_LIMITS = {
  maxPromptLength: MAX_PROMPT_LENGTH,
  maxBlocks: MAX_AI_BLOCKS,
  maxImageBlocks: MAX_AI_IMAGE_BLOCKS,
} as const;

export interface ProviderErrorDescriptor {
  status: number;
  type?: string;
  code?: string;
}

export class AiTemplateError extends Error {
  constructor(message: string, public statusCode = 400, public provider?: ProviderErrorDescriptor) {
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
  if (blocks.length > MAX_AI_BLOCKS) {
    throw new AiTemplateError(`AI layouts may contain at most ${MAX_AI_BLOCKS} blocks`, 502);
  }
  return blocks.map((block) => {
    if (!block || typeof block !== "object" || Array.isArray(block)) {
      throw new AiTemplateError("AI response contains an invalid block", 502);
    }
    return block as RawObject;
  });
}

function normalizeCanvasTheme(canvas: AiCanvasInput, raw: unknown): AiCanvasInput {
  const value = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as RawObject : {};
  return {
    ...canvas,
    backgroundColor: isSafeColor(value.backgroundColor, canvas.backgroundColor),
    textColor: isSafeColor(value.textColor, canvas.textColor),
    borderWidth: integerInRange(value.borderWidth, canvas.borderWidth, 0, 16),
    borderColor: isSafeColor(value.borderColor, canvas.borderColor),
    borderRadius: integerInRange(value.borderRadius, canvas.borderRadius, 0, 128),
  };
}

/** Converts untrusted model JSON into the editor's editable v4 content model. */
export function normalizeAiLayout(canvas: AiCanvasInput, raw: unknown): AiTemplateContent {
  const width = canvasDimension(canvas.width, 480);
  const height = canvasDimension(canvas.height, 384);
  const sourceBlocks = rawBlocks(raw);
  let imageBlocks = 0;
  const blocks = sourceBlocks.map((source, index) => {
    if (!BLOCK_TYPES.has(source.type as AiTemplateBlock["type"])) {
      throw new AiTemplateError("AI response contains an unsupported block type", 502);
    }
    const type = source.type as AiTemplateBlock["type"];
    if (type === "image" && ++imageBlocks > MAX_AI_IMAGE_BLOCKS) {
      throw new AiTemplateError(`AI layouts may contain at most ${MAX_AI_IMAGE_BLOCKS} image blocks`, 502);
    }
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

  const rawTheme = raw && typeof raw === "object" ? (raw as RawObject).canvas : undefined;
  return { version: 4, canvas: normalizeCanvasTheme(canvas, rawTheme), blocks, metadata: [] };
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
    const details = openAiErrorDetails(path, response, data);
    console.error("OpenAI AI Create request failed", details);
    if (response.status === 429) {
      const retryAfter = retryAfterSeconds(response);
      throw new AiTemplateError(
        retryAfter ? `OpenAI is rate limited. Try again in ${retryAfter} seconds.` : "OpenAI is rate limited. Try again shortly.",
        429,
        details,
      );
    }
    throw new AiTemplateError("AI Create is temporarily unavailable", 502, details);
  }
  return data;
}

export const AI_LAYOUT_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["canvas", "blocks"],
  properties: {
    canvas: {
      type: "object",
      additionalProperties: false,
      required: ["backgroundColor", "textColor", "borderWidth", "borderColor", "borderRadius"],
      properties: {
        backgroundColor: { type: "string" },
        textColor: { type: "string" },
        borderWidth: { type: "number" },
        borderColor: { type: "string" },
        borderRadius: { type: "number" },
      },
    },
    blocks: {
      type: "array",
      maxItems: MAX_AI_BLOCKS,
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
    input: [
      { role: "system", content: `Reconstruct the supplied card reference as an editable, flat 2D canvas layout. Return only the schema output. Use at most ${MAX_AI_BLOCKS} total blocks and at most ${MAX_AI_IMAGE_BLOCKS} empty image placeholders. Never use image URLs, overlays, or non-editable raster artwork. Preserve the supplied canvas dimensions.` },
      { role: "user", content: [
      { type: "input_text", text: `${matchClosely ? "Match the reference closely: preserve its dominant background, text, accent, border, and contrast colors; major regions; text hierarchy; alignment; spacing; and layering. Set the canvas theme values from the visible reference." : "Use the reference as visual inspiration while preferring its observed palette, hierarchy, and composition."} Recreate visible flat sections, dividers, badges, and accents with editable native blocks. Use empty image blocks only for photos or logos that cannot be recreated natively. [USER REQUEST]\n${prompt.trim()}` },
      { type: "input_image", image_url: reference.dataUrl, detail: "high" },
    ] },
    ],
    text: { format: { type: "json_schema", name: "card_layout", strict: true, schema: AI_LAYOUT_RESPONSE_SCHEMA } },
  });
  return parseAiLayoutResponse(trustedCanvas, response);
}

export async function createAiLayout(originalPrompt: unknown, canvas: unknown): Promise<AiTemplateContent> {
  if (typeof originalPrompt !== "string" || !originalPrompt.trim()) throw new AiTemplateError("Describe the card you want to create");
  if (originalPrompt.length > MAX_PROMPT_LENGTH) throw new AiTemplateError(`Prompt must be ${MAX_PROMPT_LENGTH} characters or fewer`);
  if (!canvas || typeof canvas !== "object") throw new AiTemplateError("A canvas is required");

  const trustedCanvas = canvas as AiCanvasInput;
  await moderate(originalPrompt.trim());
  const request = (repair?: boolean) => openAiJson("/responses", {
    model: "gpt-5.4-mini",
    input: [
      { role: "system", content: buildAiGenerationSystemPrompt(trustedCanvas) },
      { role: "user", content: repair ? "[LAYOUT REPAIR]\nThe prior layout included image blocks and exceeded the five-block limit. Return a revised layout with at most five total blocks; combine nonessential copy." : formatAiUserRequest(originalPrompt.trim()) },
    ],
    text: { format: { type: "json_schema", name: "card_layout", strict: true, schema: AI_LAYOUT_RESPONSE_SCHEMA } },
  });
  try {
    return parseAiLayoutResponse(trustedCanvas, await request());
  } catch (error) {
    if (!(error instanceof AiTemplateError) || !error.message.includes("at most 5 blocks when image blocks are used")) throw error;
    return parseAiLayoutResponse(trustedCanvas, await request(true));
  }
}

type AiResponsesPayload = {
  id?: unknown;
  status?: unknown;
  incomplete_details?: { reason?: unknown };
  error?: { code?: unknown; message?: unknown };
  output?: Array<{ type?: unknown; content?: Array<{ type?: unknown; text?: unknown; refusal?: unknown }> }>;
};

function responseOutputText(response: AiResponsesPayload): string | null {
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  return null;
}

function responseFailureMessage(response: AiResponsesPayload): string {
  const status = typeof response.status === "string" ? response.status : "unknown";
  const reason = typeof response.incomplete_details?.reason === "string" ? response.incomplete_details.reason : undefined;
  const refusal = response.output?.flatMap((item) => item.content ?? []).some((content) => typeof content.refusal === "string");
  console.error("OpenAI AI Create returned no layout", {
    responseId: typeof response.id === "string" ? response.id : undefined,
    status,
    incompleteReason: reason,
    errorCode: typeof response.error?.code === "string" ? response.error.code : undefined,
    errorMessage: typeof response.error?.message === "string" ? response.error.message : undefined,
    outputTypes: response.output?.map((item) => typeof item.type === "string" ? item.type : "unknown"),
  });
  if (refusal) return "AI Create was refused";
  if (status === "incomplete") return reason ? `AI Create did not complete: ${reason}` : "AI Create did not complete";
  if (status === "failed" || status === "cancelled") return `AI Create did not complete: ${status}`;
  return "AI Create returned no layout";
}

function parseAiLayoutResponse(canvas: AiCanvasInput, response: unknown): AiTemplateContent {
  const payload = response && typeof response === "object" ? response as AiResponsesPayload : {};
  const outputText = responseOutputText(payload);
  if (outputText === null) throw new AiTemplateError(responseFailureMessage(payload), 502);
  try {
    return normalizeAiLayout(canvas, JSON.parse(outputText));
  } catch (error) {
    if (error instanceof AiTemplateError) throw error;
    throw new AiTemplateError("AI Create returned an invalid layout", 502);
  }
}
