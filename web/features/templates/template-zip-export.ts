import type { TemplateBlock, TemplateContent } from "./types";

export interface ZipCanvasSource {
  id: string;
  title: string;
  position: number;
  content: TemplateContent;
}

export interface TemplateZipItem {
  id: string;
  path: string;
  kind: "canvas" | "block";
  canvas: ZipCanvasSource;
  block?: TemplateBlock;
}

export interface TemplateZipManifest {
  zipFileName: string;
  items: TemplateZipItem[];
}

export function safeExportName(value: string, fallback: string): string {
  return value.trim().toLowerCase().replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || fallback;
}

function uniqueName(base: string, used: Set<string>): string {
  let candidate = base;
  let suffix = 2;
  while (used.has(candidate)) candidate = `${base}-${suffix++}`;
  used.add(candidate);
  return candidate;
}

function blockLabel(block: TemplateBlock): string {
  const value = block.type === "heading" || block.type === "text" || block.type === "button" ? block.text ?? "" : block.alt ?? "";
  return safeExportName(value, "");
}

export function createTemplateZipManifest(title: string, canvases: ZipCanvasSource[]): TemplateZipManifest {
  const folders = new Set<string>();
  const items: TemplateZipItem[] = [];
  [...canvases].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id)).forEach((canvas, canvasIndex) => {
    const folder = uniqueName(`${String(canvasIndex + 1).padStart(2, "0")}-${safeExportName(canvas.title, "canvas")}`, folders);
    items.push({ id: `${canvas.id}:canvas`, path: `${folder}/00-canvas.png`, kind: "canvas", canvas });
    const names = new Set<string>();
    [...canvas.content.blocks].sort((a, b) => a.z - b.z || a.id.localeCompare(b.id)).forEach((block, blockIndex) => {
      const label = blockLabel(block) || block.type;
      const file = uniqueName(`${String(blockIndex + 1).padStart(2, "0")}-${label}`, names);
      items.push({ id: `${canvas.id}:${block.id}`, path: `${folder}/${file}.png`, kind: "block", canvas, block });
    });
  });
  return { zipFileName: `${safeExportName(title, "template")}.zip`, items };
}
