import { DEFAULT_ICON_NAME } from "./icon-constants";

export interface TemplateSummary {
  id: string;
  title: string;
  description: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Template extends TemplateSummary {
  isCode: boolean;
}

export interface CanvasSummary {
  id: string;
  title: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Canvas extends CanvasSummary {
  content: TemplateContent | null;
  html: string | null;
  react: string | null;
  angular: string | null;
}

/**
 * Variant of a universal block. Every placed block is the same entity;
 * this only decides how it renders and which inspector fields show.
 */
export type AddableBlockType =
  | "heading"
  | "text"
  | "button"
  | "image"
  | "icon"
  | "qr"
  | "barcode";

export type LegacyBlockType = "divider" | "spacer";
export type BlockType = AddableBlockType | LegacyBlockType;

export function isLegacyBlockType(type: BlockType): type is LegacyBlockType {
  return type === "divider" || type === "spacer";
}

export type CodeLang = "html" | "react" | "angular";

export type TemplateMetadataValue =
  | string
  | number
  | boolean
  | null
  | TemplateMetadataValue[]
  | { [key: string]: TemplateMetadataValue };

export type TemplateMetadataRecord = Record<string, TemplateMetadataValue>;
export type TemplateMetadata = TemplateMetadataRecord[];

export function isSquareBlock(type: BlockType): boolean {
  return type === "icon" || type === "qr";
}

export interface BlockStyle {
  color: string; // "inherit" = take main block's textColor
  backgroundColor: string;
  fontSize: number;
  fontWeight: number;
  /** Full CSS font-family stack; absent = app default. */
  fontFamily?: string;
  italic?: boolean;
  underline?: boolean;
  textAlign: "left" | "center" | "right";
  padding: number;
  borderWidth: number; // 0 = none
  borderColor: string;
  borderRadius: number; // 0 = none
}

/** Universal block: free-positioned rectangle on the canvas (Figma-like). */
export interface TemplateBlock {
  id: string;
  type: BlockType;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Paint order; higher values render above lower ones. */
  z: number;
  text?: string;
  level?: 1 | 2 | 3;
  href?: string;
  src?: string;
  alt?: string;
  /** Lucide icon name (kebab-case); used by the "icon" variant. */
  icon?: string;
  style: BlockStyle;
}

export interface TemplateCanvas {
  width: string; // "auto" | "<n>px"
  height: string;
  backgroundColor: string;
  textColor: string;
  overlayImage: string; // "" = none
  overlayFit: "cover" | "contain";
  overlayOpacity: number; // 0-100
  overlayMargin: number; // px gap between image and main block edges
  overlayPadding: number; // px transparent ring inside the image box
  borderWidth: number; // 0 = none
  borderColor: string;
  borderRadius: number; // 0 = none
}

export const DEFAULT_CANVAS: TemplateCanvas = {
  width: "505px",
  height: "319px",
  backgroundColor: "#ffffff",
  textColor: "#000000",
  overlayImage: "",
  overlayFit: "cover",
  overlayOpacity: 60,
  overlayMargin: 0,
  overlayPadding: 0,
  borderWidth: 0,
  borderColor: "#e4e4e7",
  borderRadius: 0,
};

/** Working pixel size used by the editor stage when canvas size is "auto". */
export const AUTO_CANVAS_WIDTH = 480;
export const AUTO_CANVAS_HEIGHT = 384;

export interface TemplateContent {
  version: 4;
  canvas: TemplateCanvas;
  blocks: TemplateBlock[];
  metadata: TemplateMetadata;
}

function parsePx(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = value.match(/^(\d+(?:\.\d+)?)px$/);
  return match ? Number(match[1]) : null;
}

export function workingCanvasSize(canvas: TemplateCanvas): {
  width: number;
  height: number;
} {
  return {
    width: canvas.width === "auto" ? AUTO_CANVAS_WIDTH : parsePx(canvas.width) ?? AUTO_CANVAS_WIDTH,
    height: canvas.height === "auto" ? AUTO_CANVAS_HEIGHT : parsePx(canvas.height) ?? AUTO_CANVAS_HEIGHT,
  };
}

export function defaultBlockStyle(): BlockStyle {
  return {
    color: "inherit",
    backgroundColor: "transparent",
    fontSize: 16,
    fontWeight: 400,
    textAlign: "left",
    padding: 8,
    borderWidth: 0,
    borderColor: "#d4d4d8",
    borderRadius: 0,
  };
}

function stripLegacySize(style: Record<string, unknown>): BlockStyle {
  const clone = { ...style };
  delete clone.width;
  delete clone.height;
  return clone as unknown as BlockStyle;
}

function normalizeStyle(raw: unknown): BlockStyle {
  return { ...defaultBlockStyle(), ...stripLegacySize({ ...(raw as object) }) };
}

function hasGeometry(block: Record<string, unknown>): boolean {
  return (
    typeof block.x === "number" &&
    typeof block.y === "number" &&
    typeof block.width === "number" &&
    typeof block.height === "number"
  );
}

/** Rough flow-layout heights used when migrating v1 templates. */
function estimateFlowHeight(block: Record<string, unknown>, style: BlockStyle): number {
  const pad = style.padding * 2;
  switch (block.type) {
    case "spacer":
      return Number(block.height) || 32;
    case "divider":
      return pad + 1;
    case "image":
      return (Number(block.height) || 180) + pad;
    case "icon":
      return Number(block.height) || 48;
    case "button":
      return Math.round(style.fontSize * 1.5) + 20 + pad;
    case "heading":
    case "text":
    default:
      return Math.round(style.fontSize * 1.45) + pad;
  }
}

const LEGACY_DEFAULT_WIDTH: Record<BlockType, number> = {
  heading: 300,
  text: 320,
  button: 160,
  image: 260,
  icon: 48,
  divider: 320,
  spacer: 120,
  qr: 120,
  barcode: 200,
};

/** Converts pre-Figma flow-layout blocks into stacked positioned blocks. */
function migrateLegacyBlocks(raw: Record<string, unknown>[], canvasWidthPx: number): TemplateBlock[] {
  const MARGIN = 12;
  const GAP = 8;
  const maxW = Math.max(64, canvasWidthPx - MARGIN * 2);
  let y = MARGIN;
  return raw.map((b, index) => {
    const type = (b.type ?? "text") as BlockType;
    const style = normalizeStyle(b.style);
    const legacyW = parsePx((b.style as Record<string, unknown>)?.width);
    const legacyH = parsePx((b.style as Record<string, unknown>)?.height);
    const width = Math.min(Math.max(16, legacyW ?? LEGACY_DEFAULT_WIDTH[type]), maxW);
    const height = Math.max(16, legacyH ?? estimateFlowHeight(b, style));
    const migrated: TemplateBlock = {
      id: typeof b.id === "string" ? b.id : crypto.randomUUID(),
      type,
      x: MARGIN,
      y,
      width,
      height,
      z: index,
      style,
    };
    if (typeof b.text === "string") migrated.text = b.text;
    if (typeof b.href === "string") migrated.href = b.href;
    if (typeof b.src === "string") migrated.src = b.src;
    if (typeof b.alt === "string") migrated.alt = b.alt;
    if (b.level === 1 || b.level === 2 || b.level === 3) migrated.level = b.level;
    y += height + GAP;
    return migrated;
  });
}

function normalizePositionedBlock(b: Record<string, unknown>, index: number): TemplateBlock {
  const type = (b.type ?? "text") as BlockType;
  const migrated: TemplateBlock = {
    id: typeof b.id === "string" ? b.id : crypto.randomUUID(),
    type,
    x: Math.round(Number(b.x) || 0),
    y: Math.round(Number(b.y) || 0),
    width: Math.max(16, Math.round(Number(b.width) || LEGACY_DEFAULT_WIDTH[type])),
    height: Math.max(16, Math.round(Number(b.height) || 32)),
    z:
      typeof b.z === "number" && Number.isFinite(b.z)
        ? Math.max(0, Math.round(b.z))
        : index,
    style: normalizeStyle(b.style),
  };
  if (typeof b.text === "string") migrated.text = b.text;
  if (typeof b.href === "string") migrated.href = b.href;
  if (typeof b.src === "string") migrated.src = b.src;
  if (typeof b.alt === "string") migrated.alt = b.alt;
  if (typeof b.icon === "string") migrated.icon = b.icon;
  if (b.level === 1 || b.level === 2 || b.level === 3) migrated.level = b.level;
  // icon blocks are always square; heal saved content where they diverged
  if (type === "icon") migrated.height = migrated.width;
  return migrated;
}

function isMetadataRecord(value: unknown): value is TemplateMetadataRecord {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeMetadataRecords(raw: unknown): TemplateMetadata {
  if (Array.isArray(raw)) {
    return raw.filter(isMetadataRecord).filter((record) => Object.keys(record).length > 0);
  }
  return isMetadataRecord(raw) && Object.keys(raw).length > 0 ? [raw] : [];
}

export function parseContent(raw: unknown): TemplateContent {
  const canvasOf = (obj: unknown): TemplateCanvas => ({
    ...DEFAULT_CANVAS,
    ...((obj as Partial<TemplateContent>)?.canvas ?? {}),
  });

  if (Array.isArray(raw)) {
    const canvas = { ...DEFAULT_CANVAS };
    const { width } = workingCanvasSize(canvas);
    return { version: 4, canvas, blocks: migrateLegacyBlocks(raw, width), metadata: [] };
  }
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const canvas = canvasOf(obj);
    const { width } = workingCanvasSize(canvas);
    const rawBlocks = Array.isArray(obj.blocks) ? (obj.blocks as Record<string, unknown>[]) : [];
    const isV2 = rawBlocks.length > 0 && rawBlocks.every(hasGeometry);
    return {
      version: 4,
      canvas,
      blocks: isV2 ? rawBlocks.map((b, i) => normalizePositionedBlock(b, i)) : migrateLegacyBlocks(rawBlocks, width),
      metadata: normalizeMetadataRecords(obj.metadata),
    };
  }
  return { version: 4, canvas: { ...DEFAULT_CANVAS }, blocks: [], metadata: [] };
}

/** Factory for the universal block; every new block starts as a Text variant. */
export function createUniversalBlock(
  x = 0,
  y = 0,
  type: BlockType = "text",
  z = 0
): TemplateBlock {
  const base = {
    id: crypto.randomUUID(),
    x: Math.round(x),
    y: Math.round(y),
    z: Math.max(0, Math.round(z)),
  };
  switch (type) {
    case "heading":
      return {
        ...base,
        type,
        width: 280,
        height: 44,
        text: "Heading",
        level: 2,
        style: { ...defaultBlockStyle(), fontSize: 28, fontWeight: 600 },
      };
    case "button":
      return {
        ...base,
        type,
        width: 160,
        height: 48,
        text: "Click me",
        href: "#",
        style: {
          ...defaultBlockStyle(),
          color: "#ffffff",
          backgroundColor: "#18181b",
          textAlign: "center",
          padding: 8,
          borderRadius: 8,
        },
      };
    case "image":
      return { ...base, type, width: 240, height: 180, src: "", alt: "", style: { ...defaultBlockStyle(), borderRadius: 0 } };
    case "divider":
      return { ...base, type, width: 220, height: 9, style: { ...defaultBlockStyle(), borderRadius: 0, padding: 4 } };
    case "spacer":
      return { ...base, type, width: 280, height: 44, style: defaultBlockStyle() };
    case "icon":
      return {
        ...base,
        type,
        width: 48,
        height: 48,
        icon: DEFAULT_ICON_NAME,
        style: defaultBlockStyle(),
      };
    case "qr":
      return {
        ...base,
        type,
        width: 120,
        height: 120,
        text: "https://example.com",
        style: { ...defaultBlockStyle(), padding: 8 },
      };
    case "barcode":
      return {
        ...base,
        type,
        width: 200,
        height: 80,
        text: "123456789",
        style: { ...defaultBlockStyle(), padding: 8 },
      };
    case "text":
    default:
      return { ...base, type: "text", width: 280, height: 44, text: "Write something...", style: defaultBlockStyle() };
  }
}
