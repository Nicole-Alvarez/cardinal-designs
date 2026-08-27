import {
  extractReactPropPaths,
  withReactPlaceholderFallbacks,
} from "./metadata";
import { buildSandboxDocument } from "./html-sandbox-document";
import type { TemplateMetadata } from "./types";

export async function buildReactSandboxDocument(
  source: string,
  metadata: TemplateMetadata,
  channel = ""
): Promise<string> {
  const Babel = await import("@babel/standalone");
  const compiledCode = Babel.transform(source, {
    filename: "template.tsx",
    presets: [
      ["react", { runtime: "classic" }],
      ["typescript", { ignoreExtensions: true }],
    ],
    plugins: ["transform-modules-commonjs"],
  }).code;
  if (!compiledCode) throw new Error("Compilation produced no output.");

  const fields = extractReactPropPaths(source);
  const sourceRecords = metadata.length > 0 ? metadata : [{}];
  const records = sourceRecords.map((record) =>
    withReactPlaceholderFallbacks(record, fields)
  );
  return buildSandboxDocument(
    { mode: "react", compiledCode, records },
    channel
  );
}
