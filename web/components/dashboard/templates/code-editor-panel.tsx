"use client";

import { useRef, useState } from "react";
import type { CodeLang, TemplateMetadata } from "@/features/templates/types";
import AccessibleDialog from "@/components/ui/accessible-dialog";
import { EditorIcon, EditorTooltip } from "./editor-controls";
import CodeImportDialog from "./code-import-dialog";

const LANG_LABEL: Record<Exclude<CodeLang, "angular">, { label: string; icon: string }> = {
  html: { label: "HTML", icon: "code-xml" },
  react: { label: "React", icon: "atom" },
};

export default function CodeEditorPanel({
  lang,
  code,
  onCodeChange,
  metadata,
  onOpenMetadata,
  onConvertToWysiwyg,
  onImportCode,
}: {
  lang: CodeLang;
  code: string;
  onCodeChange: (value: string) => void;
  metadata: TemplateMetadata;
  onOpenMetadata: () => void;
  onConvertToWysiwyg: () => void;
  onImportCode: (lang: "html" | "react", source: string) => void;
}) {
  const [conversionDialogOpen, setConversionDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const conversionButtonRef = useRef<HTMLButtonElement>(null);
  const activeLanguage = LANG_LABEL[lang === "angular" ? "html" : lang];
  const lineCount = code ? code.split("\n").length : 0;

  function closeConversionDialog() {
    setConversionDialogOpen(false);
    requestAnimationFrame(() => conversionButtonRef.current?.focus());
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-white/95 p-3 dark:border-zinc-800 dark:bg-zinc-900/95">
          <div className="flex shrink-0 items-center gap-2 pr-1">
            <span className="grid size-8 place-items-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              <EditorIcon name="file-code" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Code workspace
              </h2>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                Preview updates in the toolbar preview
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setImportDialogOpen(true)}
            data-template-selection-preserving
            aria-label={`Change code type (currently ${activeLanguage.label})`}
            className="flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl bg-zinc-100 px-3 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <EditorIcon name={activeLanguage.icon} className="size-3.5" />
            {activeLanguage.label}
          </button>

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <EditorTooltip label="Import code" align="right">
              <button
                type="button"
                onClick={() => setImportDialogOpen(true)}
                aria-label="Import code"
                className="grid size-11 place-items-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white sm:size-9"
              >
                <EditorIcon name="arrow-up-right" />
              </button>
            </EditorTooltip>
            <EditorTooltip label="Preview data" align="right">
              <button
                type="button"
                onClick={onOpenMetadata}
                data-template-selection-preserving
                aria-label={`Preview data, ${metadata.length} records`}
                className="relative grid size-11 place-items-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white sm:size-9"
              >
                <EditorIcon name="database" />
                {metadata.length > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-blue-600 px-1 text-center text-[9px] font-semibold leading-4 text-white">
                    {metadata.length}
                  </span>
                )}
              </button>
            </EditorTooltip>
            <EditorTooltip
              label={
                lang === "angular"
                  ? "Angular conversion is not supported yet"
                  : `Convert ${lang === "react" ? "React TSX" : "HTML"} to Visual`
              }
              align="right"
            >
              <button
                ref={conversionButtonRef}
                type="button"
                onClick={() => setConversionDialogOpen(true)}
                disabled={lang === "angular"}
                className="flex min-h-11 items-center gap-1.5 rounded-lg bg-zinc-950 px-3 text-xs font-medium text-white shadow-sm transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-900 sm:min-h-9"
              >
                <EditorIcon name="wand-sparkles" />
                <span className="hidden sm:inline">Convert to Visual</span>
              </button>
            </EditorTooltip>
          </div>
        </div>

        <div className="bg-zinc-950 p-2">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1.5 font-medium text-zinc-300">
              <EditorIcon name={activeLanguage.icon} className="size-3.5" />
              {activeLanguage.label}
            </span>
            <span className="tabular-nums">
              {lineCount} {lineCount === 1 ? "line" : "lines"} · {code.length} characters
            </span>
          </div>
          <textarea
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            rows={14}
            spellCheck={false}
            aria-label={`${activeLanguage.label} template code`}
            placeholder={
              lang === "react"
                ? "export default function Template() {\n  return (...);\n}"
                : "<div>...</div>"
            }
            className="min-h-72 w-full resize-y rounded-b-xl bg-zinc-950 p-4 font-mono text-xs leading-6 text-zinc-200 outline-none placeholder:text-zinc-700 focus:bg-zinc-900 selection:bg-zinc-700"
          />
        </div>
      </section>

      {importDialogOpen && (
        <CodeImportDialog
          open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          initialType={lang === "react" ? "react" : "html"}
          onImport={(importLang, source) => {
            onImportCode(importLang, source);
            setImportDialogOpen(false);
          }}
        />
      )}

      {conversionDialogOpen && (
        <ConversionDisclaimerDialog
          lang={lang}
          onClose={closeConversionDialog}
          onConfirm={() => {
            closeConversionDialog();
            onConvertToWysiwyg();
          }}
        />
      )}
    </div>
  );
}

function ConversionDisclaimerDialog({
  lang,
  onClose,
  onConfirm,
}: {
  lang: CodeLang;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <AccessibleDialog
      open
      onClose={onClose}
      labelledBy="conversion-disclaimer-title"
      describedBy="conversion-disclaimer-description"
      initialFocusRef={cancelRef}
      panelClassName="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
    >
      <div data-template-selection-preserving>
        <div className="flex items-start gap-3 border-b border-zinc-200 p-5 dark:border-zinc-800">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300">
            <EditorIcon name="wand-sparkles" />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="conversion-disclaimer-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Convert {lang === "react" ? "React" : "HTML"} to Visual?
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Create editable canvas blocks from this source.
            </p>
          </div>
          <EditorTooltip label="Close" align="right">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close conversion dialog"
              className="grid size-8 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              <EditorIcon name="x" />
            </button>
          </EditorTooltip>
        </div>
        <div className="p-5">
          <div
            id="conversion-disclaimer-description"
            className="flex items-start gap-2.5 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200"
          >
            <EditorIcon name="circle-alert" className="mt-1 size-4 shrink-0" />
            <p>
              Conversion is best-effort. Layout, fonts, spacing, effects, and unsupported custom code may differ from the original preview.
            </p>
          </div>
          <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-900"
          >
            <EditorIcon name="wand-sparkles" />
            Continue conversion
          </button>
          </div>
        </div>
      </div>
    </AccessibleDialog>
  );
}
