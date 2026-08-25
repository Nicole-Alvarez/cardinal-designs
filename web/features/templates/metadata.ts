import type {
  CodeLang,
  TemplateBlock,
  TemplateMetadata,
  TemplateMetadataRecord,
  TemplateMetadataValue,
} from "./types";

const PLACEHOLDER_PATTERN = /{{\s*([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*}}/g;
const REACT_EXPRESSION_PATTERN = /{\s*([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*}/g;
const BLOCK_TEMPLATE_KEYS = ["text", "href", "src", "alt"] as const;

export function extractPlaceholderPaths(value: string): string[] {
  const paths = new Set<string>();
  for (const match of value.matchAll(PLACEHOLDER_PATTERN)) paths.add(match[1]);
  return [...paths];
}

export function extractReactPropPaths(source: string): string[] {
  const paths = new Set<string>();
  for (const match of source.matchAll(/interface\s+\w*Props\s*{([\s\S]*?)}/g)) {
    for (const property of match[1].matchAll(/(?:^|[;\n])\s*([A-Za-z_$][\w$]*)\??\s*:/g)) {
      paths.add(property[1]);
    }
  }
  for (const match of source.matchAll(/(?:export\s+default\s+)?function\s+\w*\s*\(\s*{([^}]*)}/g)) {
    for (const entry of match[1].split(",")) {
      const name = entry.trim().match(/^([A-Za-z_$][\w$]*)/);
      if (name) paths.add(name[1]);
    }
  }
  for (const textRegion of source.matchAll(/>([^<]*)</g)) {
    for (const expression of textRegion[1].matchAll(REACT_EXPRESSION_PATTERN)) paths.add(expression[1]);
  }
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
    for (const [lang, source] of Object.entries(codeBuffers) as [CodeLang, string][]) {
      for (const path of extractPlaceholderPaths(source)) paths.add(path);
      if (lang === "react") for (const path of extractReactPropPaths(source)) paths.add(path);
    }
  }
  return [...paths].sort();
}

export function firstMetadataRecord(metadata: TemplateMetadata): TemplateMetadataRecord {
  return metadata[0] ?? {};
}

export function withReactPlaceholderFallbacks(
  record: TemplateMetadataRecord,
  paths: string[]
): TemplateMetadataRecord {
  const resolved = JSON.parse(JSON.stringify(record)) as TemplateMetadataRecord;
  for (const path of paths) {
    if (metadataValue(resolved, path) !== undefined) continue;
    const segments = path.split(".");
    let current = resolved;
    segments.forEach((segment, index) => {
      if (index === segments.length - 1) {
        current[segment] = `{${path}}`;
        return;
      }
      const existing = current[segment];
      if (!existing || typeof existing !== "object" || Array.isArray(existing)) current[segment] = {};
      current = current[segment] as TemplateMetadataRecord;
    });
  }
  return resolved;
}

export function metadataValue(
  metadata: TemplateMetadataRecord,
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

export function resolveTemplateString(value: string, metadata: TemplateMetadataRecord): string {
  return value.replace(PLACEHOLDER_PATTERN, (placeholder, path: string) => {
    const resolved = metadataValue(metadata, path);
    return resolved === undefined ? placeholder : metadataDisplayValue(resolved);
  });
}

export function resolveTemplateBlock(
  block: TemplateBlock,
  metadata: TemplateMetadataRecord
): TemplateBlock {
  const resolved = { ...block };
  for (const key of BLOCK_TEMPLATE_KEYS) {
    const value = block[key];
    if (typeof value === "string") resolved[key] = resolveTemplateString(value, metadata);
  }
  return resolved;
}

function mergePath(record: TemplateMetadataRecord, path: string): void {
  const segments = path.split(".");
  let current = record;
  segments.forEach((segment, index) => {
    if (index === segments.length - 1) {
      if (!Object.prototype.hasOwnProperty.call(current, segment)) current[segment] = "";
      return;
    }
    const existing = current[segment];
    if (!existing || typeof existing !== "object" || Array.isArray(existing)) current[segment] = {};
    current = current[segment] as TemplateMetadataRecord;
  });
}

export function mergeDetectedMetadata(
  metadata: TemplateMetadata,
  paths: string[]
): TemplateMetadata {
  if (metadata.length === 0 && paths.length === 0) return [];
  const merged = JSON.parse(JSON.stringify(metadata.length > 0 ? metadata : [{}])) as TemplateMetadata;
  for (const record of merged) for (const path of paths) mergePath(record, path);
  return merged;
}

function isRecord(value: unknown): value is TemplateMetadataRecord {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function parseMetadataJson(source: string): TemplateMetadata {
  const parsed = JSON.parse(source) as unknown;
  const records = Array.isArray(parsed) ? parsed : [parsed];
  if (!records.every(isRecord)) {
    throw new Error("Metadata must be a JSON object or an array of objects.");
  }
  return records.filter((record) => Object.keys(record).length > 0);
}

export function metadataFieldCount(metadata: TemplateMetadata): number {
  return new Set(metadata.flatMap((record) => Object.keys(record))).size;
}

function parseCsvRows(source: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        value += '"';
        index++;
      } else if (char === '"') quoted = false;
      else value += char;
    } else if (char === '"' && value.length === 0) quoted = true;
    else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else value += char;
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted value.");
  if (value.length > 0 || row.length > 0) {
    row.push(value.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows.filter((candidate) => candidate.some((cell) => cell.trim() !== ""));
}

export function parseMetadataCsv(source: string): TemplateMetadata {
  const rows = parseCsvRows(source);
  if (rows.length < 2) throw new Error("CSV must include a header row and at least one data row.");
  const headers = rows[0].map((header, index) =>
    (index === 0 ? header.replace(/^\uFEFF/, "") : header).trim()
  );
  if (headers.some((header) => !/^[A-Za-z_$][\w$]*$/.test(header))) {
    throw new Error("CSV headers must be valid metadata field names.");
  }
  if (new Set(headers).size !== headers.length) throw new Error("CSV headers must be unique.");
  return rows.slice(1).map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]))
  );
}
