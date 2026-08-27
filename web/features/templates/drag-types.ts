import type { AddableBlockType } from "./types";

export const CARDINAL_BLOCK_MIME = "application/x-cardinal-block";

const BLOCK_TYPES = new Set<AddableBlockType>([
  "heading",
  "text",
  "button",
  "image",
  "icon",
  "qr",
  "barcode",
]);

export function blockDragPayload(type: AddableBlockType): string {
  return `new:${type}`;
}

export function blockTypeFromDragPayload(value: string): AddableBlockType | null {
  if (!value.startsWith("new:")) return null;
  const type = value.slice(4) as AddableBlockType;
  return BLOCK_TYPES.has(type) ? type : null;
}
