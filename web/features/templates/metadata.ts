import type {
  CodeLang,
  TemplateBlock,
  TemplateMetadata,
  TemplateMetadataValue,
} from "./types";

const PLACEHOLDER_PATTERN = /{{\s*([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*}}/g;
const BLOCK_TEMPLATE_KEYS = ["text", "href", "src", "alt"] as const;

export function extractPlaceholderPaths(value: string): string[] {
  const paths = new Set<string>();
  for (const match of value.matchAll(PLACEHOLDER_PATTERN)) paths.add(match[1]);
  return [...paths];
}

export function detectTemplateFields(
  blocks: TemplateBlock[],
  codeBuffers?: Record<CodeLang, string>
): string[] {
  const paths = new Set<string>();
  for (const block of blocks) {
    for (const key of BLOCK_TEMPLATE_KEYS) {
      const value = block[key];
      if (typeof value === "string") {
        for (const path of extractPlaceholderPaths(value)) paths.add(path);
      }
    }
  }
  if (codeBuffers) {
    for (const source of Object.values(codeBuffers)) {
      for (const path of extractPlaceholderPaths(source)) paths.add(path);
    }
  }
  return [...paths].sort();
}

export function metadataValue(
  metadata: TemplateMetadata,
  path: string
): TemplateMetadataValue | undefined {
  let value: TemplateMetadataValue | undefined = metadata;
  for (const segment of path.split(".")) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
    if (!Object.prototype.hasOwnProperty.call(value, segment)) return undefined;
    value = value[segment];
  }
  return value;
}

export function metadataDisplayValue(value: TemplateMetadataValue): string {
  if (value === null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

export function resolveTemplateString(value: string, metadata: TemplateMetadata): string {
  return value.replace(PLACEHOLDER_PATTERN, (placeholder, path: string) => {
    const resolved = metadataValue(metadata, path);
    return resolved === undefined ? placeholder : metadataDisplayValue(resolved);
  });
}

export function resolveTemplateBlock(
  block: TemplateBlock,
  metadata: TemplateMetadata
): TemplateBlock {
  const resolved = { ...block };
  for (const key of BLOCK_TEMPLATE_KEYS) {
    const value = block[key];
    if (typeof value === "string") resolved[key] = resolveTemplateString(value, metadata);
  }
  return resolved;
}

export function mergeDetectedMetadata(
  metadata: TemplateMetadata,
  paths: string[]
): TemplateMetadata {
  const merged = JSON.parse(JSON.stringify(metadata)) as TemplateMetadata;
  for (const path of paths) {
    const segments = path.split(".");
    let current: TemplateMetadata = merged;
    segments.forEach((segment, index) => {
      if (index === segments.length - 1) {
        if (!Object.prototype.hasOwnProperty.call(current, segment)) current[segment] = "";
        return;
      }
      const existing = current[segment];
      if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
        current[segment] = {};
      }
      current = current[segment] as TemplateMetadata;
    });
  }
  return merged;
}

export function parseMetadataJson(source: string): TemplateMetadata {
  const parsed = JSON.parse(source) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Metadata must be a JSON object.");
  }
  return parsed as TemplateMetadata;
}
