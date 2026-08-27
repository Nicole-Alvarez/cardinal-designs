"use client";

import { useRef, useState } from "react";
import {
  metadataFieldCount,
  mergeDetectedMetadata,
  parseMetadataCsv,
  parseMetadataJson,
} from "@/features/templates/metadata";
import type { TemplateMetadata } from "@/features/templates/types";
import AccessibleDialog from "@/components/ui/accessible-dialog";
import { Button } from "@/components/ui/button";
import { EditorIcon } from "./editor-controls";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    <AccessibleDialog
      open
      onClose={onClose}
      labelledBy="metadata-dialog-title"
      describedBy="metadata-dialog-description"
      initialFocusRef={textareaRef}
      panelClassName="w-full max-w-2xl rounded-2xl border border-border-subtle bg-surface-1 p-5 text-text-primary shadow-2xl"
    >
      <div data-template-selection-preserving>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="metadata-dialog-title" className="text-lg font-semibold text-text-primary">
              Preview data
            </h2>
            <p id="metadata-dialog-description" className="mt-1 text-xs text-text-secondary">
              Each JSON object or CSV row renders one preview. Use values in blocks with {"{{field}}"}.
            </p>
            <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">
              Preview data is temporary and is never saved with the template.
            </p>
          </div>
          <Button
            type="button"
            onClick={onClose}
            aria-label="Close preview data dialog"
            variant="ghost"
            size="icon"
          >
            <EditorIcon name="x" />
          </Button>
        </div>

        {detectedPaths.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Detected fields
            </p>
            <div className="flex flex-wrap gap-1.5">
              {detectedPaths.map((path) => (
                  <code key={path} className="rounded bg-surface-2 px-2 py-1 text-xs text-text-secondary">
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
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              variant="secondary"
              size="compact"
            >
              Import JSON or CSV
            </Button>
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
          ref={textareaRef}
          id="template-metadata-json"
          value={source}
          onChange={(event) => {
            setSource(event.target.value);
            setError(null);
            setCheckResult(null);
          }}
          rows={16}
          spellCheck={false}
          className="mt-2 w-full rounded-xl border border-border-subtle bg-surface-2 p-3 font-mono text-sm leading-relaxed text-text-primary outline-none focus-visible:border-border-strong focus-visible:ring-2 focus-visible:ring-focus"
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
          <Button
            type="button"
            onClick={handleCheck}
            variant="secondary"
          >
            Check JSON
          </Button>
          <Button
            type="button"
            onClick={handleSave}
          >
            Apply to preview
          </Button>
        </div>
      </div>
    </AccessibleDialog>
  );
}
