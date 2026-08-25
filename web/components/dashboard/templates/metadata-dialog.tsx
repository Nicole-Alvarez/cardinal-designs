"use client";

import { useEffect, useRef, useState } from "react";
import {
  metadataFieldCount,
  mergeDetectedMetadata,
  parseMetadataCsv,
  parseMetadataJson,
} from "@/features/templates/metadata";
import type { TemplateMetadata } from "@/features/templates/types";

interface MetadataDialogProps {
  open: boolean;
  metadata: TemplateMetadata;
  detectedPaths: string[];
  onClose: () => void;
  onSave: (metadata: TemplateMetadata) => void;
}

export default function MetadataDialog({
  open,
  metadata,
  detectedPaths,
  onClose,
  onSave,
}: MetadataDialogProps) {
  if (!open) return null;
  const initialMetadata = metadata.length > 0
    ? metadata
    : mergeDetectedMetadata([], detectedPaths);
  return (
    <MetadataDialogContent
      key={JSON.stringify(initialMetadata)}
      initialMetadata={initialMetadata}
      detectedPaths={detectedPaths}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

function MetadataDialogContent({
  initialMetadata,
  detectedPaths,
  onClose,
  onSave,
}: {
  initialMetadata: TemplateMetadata;
  detectedPaths: string[];
  onClose: () => void;
  onSave: (metadata: TemplateMetadata) => void;
}) {
  const [source, setSource] = useState(() => JSON.stringify(initialMetadata, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function parse(): TemplateMetadata | null {
    try {
      const parsed = parseMetadataJson(source);
      setError(null);
      return parsed;
    } catch (err) {
      setCheckResult(null);
      setError(err instanceof SyntaxError ? `Invalid JSON: ${err.message}` : (err as Error).message);
      return null;
    }
  }

  function handleCheck() {
    const parsed = parse();
    if (parsed === null) return;
    const fields = metadataFieldCount(parsed);
    setCheckResult(
      `Valid JSON · ${parsed.length} ${parsed.length === 1 ? "record" : "records"} · ${fields} ${fields === 1 ? "field" : "fields"}`
    );
  }

  function handleSave() {
    const parsed = parse();
    if (!parsed) return;
    onSave(parsed);
    onClose();
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const contents = await file.text();
      const imported = file.name.toLowerCase().endsWith(".csv")
        ? parseMetadataCsv(contents)
        : parseMetadataJson(contents);
      setSource(JSON.stringify(imported, null, 2));
      setError(null);
      setCheckResult(null);
    } catch (err) {
      setCheckResult(null);
      setError(`Could not import ${file.name}: ${(err as Error).message}`);
    }
  }

  let summary: TemplateMetadata | null = null;
  try {
    summary = parseMetadataJson(source);
  } catch {
    summary = null;
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="metadata-dialog-title"
        data-template-selection-preserving
        className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="metadata-dialog-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Preview metadata
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Each JSON object or CSV row renders one preview. Use values in blocks with {"{{field}}"}.
            </p>
            <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">
              Preview metadata is temporary and is never saved with the template.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close metadata dialog"
            className="rounded-md px-2 py-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            ×
          </button>
        </div>

        {detectedPaths.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Detected fields
            </p>
            <div className="flex flex-wrap gap-1.5">
              {detectedPaths.map((path) => (
                <code key={path} className="rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {path}
                </code>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300" htmlFor="template-metadata-json">
            JSON records
          </label>
          <div className="flex items-center gap-2">
            {summary && (
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {summary.length} {summary.length === 1 ? "record" : "records"} · {metadataFieldCount(summary)} fields
              </span>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Import JSON or CSV
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv,application/json,text/csv"
              onChange={handleImport}
              className="hidden"
            />
          </div>
        </div>
        <textarea
          id="template-metadata-json"
          value={source}
          onChange={(event) => {
            setSource(event.target.value);
            setError(null);
            setCheckResult(null);
          }}
          rows={16}
          spellCheck={false}
          autoFocus
          className="mt-2 w-full rounded-xl border border-zinc-300 bg-white p-3 font-mono text-xs leading-relaxed text-zinc-800 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
        />
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Extra fields are ignored. When a field is missing, its placeholder remains in the preview.
        </p>
        {error && <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
        {checkResult && (
          <p aria-live="polite" className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            {checkResult}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCheck}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Check JSON
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Apply to preview
          </button>
        </div>
      </section>
    </div>
  );
}
