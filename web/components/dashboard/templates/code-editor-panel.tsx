"use client";

import { useRef, useState } from "react";
import type { CodeLang, TemplateMetadata } from "@/features/templates/types";
import { EditorIcon, EditorTooltip } from "./editor-controls";
import PreviewExportActions from "./preview-export-actions";
import SandboxedCodePreview, {
  type SandboxedCodePreviewHandle,
} from "./sandboxed-code-preview";
import AccessibleDialog from "@/components/ui/accessible-dialog";
import { handleTabKeyboardNavigation } from "@/components/ui/tab-keyboard";

const LANGS: { value: CodeLang; label: string; icon: string }[] = [
  { value: "html", label: "HTML", icon: "code-xml" },
  { value: "react", label: "React", icon: "atom" },
  { value: "angular", label: "Angular", icon: "triangle" },
];

export default function CodeEditorPanel({
  title,
  lang,
  onLangChange,
  code,
  onCodeChange,
  metadata,
  onOpenMetadata,
  onConvertToWysiwyg,
}: {
  title: string;
  lang: CodeLang;
  onLangChange: (lang: CodeLang) => void;
  code: string;
  onCodeChange: (value: string) => void;
  metadata: TemplateMetadata;
  onOpenMetadata: () => void;
  onConvertToWysiwyg: () => void;
}) {
  const [conversionDialogOpen, setConversionDialogOpen] = useState(false);
  const conversionButtonRef = useRef<HTMLButtonElement>(null);
  const sandboxPreviewRef = useRef<SandboxedCodePreviewHandle>(null);
  const activeLanguage = LANGS.find((language) => language.value === lang) ?? LANGS[0];
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
                Preview updates as you type
              </p>
            </div>
          </div>

          <div
            role="tablist"
            aria-label="Code language"
            className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800/80"
          >
            {LANGS.map((language, index) => (
              <button
                key={language.value}
                type="button"
                role="tab"
                id={`code-tab-${language.value}`}
                aria-controls="code-editor-panel"
                aria-selected={lang === language.value}
                tabIndex={lang === language.value ? 0 : -1}
                onClick={() => onLangChange(language.value)}
                onKeyDown={(event) =>
                  handleTabKeyboardNavigation(event, index, LANGS.length, (nextIndex) =>
                    onLangChange(LANGS[nextIndex].value)
                  )
                }
                className={
                  "flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 sm:min-h-9 " +
                  (lang === language.value
                    ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-700 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100")
                }
              >
                <EditorIcon name={language.icon} className="size-3.5" />
                {language.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1">
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

        <div
          id="code-editor-panel"
          role="tabpanel"
          aria-labelledby={`code-tab-${lang}`}
          className="bg-zinc-950 p-2"
        >
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
              lang === "html"
                ? "<div>...</div>"
                : lang === "react"
                  ? "export default function Template() {\n  return (...);\n}"
                  : "@Component({ ... })\nexport class ... {}"
            }
            className="min-h-72 w-full resize-y rounded-b-xl bg-zinc-950 p-4 font-mono text-xs leading-6 text-zinc-200 outline-none placeholder:text-zinc-700 focus:bg-zinc-900 selection:bg-zinc-700"
          />
        </div>
      </section>

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

      {(lang === "html" || lang === "react") && code.trim() && (
        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-zinc-200 p-3 dark:border-zinc-800">
            <PreviewHeader label={`Preview (${lang === "react" ? "React" : "HTML"})`} />
            <PreviewExportActions
              title={title}
              previewRenderer={(target, options) => {
                const preview = sandboxPreviewRef.current;
                if (!preview) return Promise.reject(new Error("Preview is not ready yet."));
                return preview.renderImages(target, options);
              }}
            />
          </div>
          <div className="max-h-[32rem] overflow-auto bg-zinc-100/70 p-5 dark:bg-zinc-950/50">
            <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-inner dark:border-zinc-800">
              <SandboxedCodePreview
                ref={sandboxPreviewRef}
                mode={lang}
                code={code}
                metadata={metadata}
              />
            </div>
          </div>
        </section>
      )}

      {lang === "angular" && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-zinc-200/70 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            <EditorIcon name="info" />
          </span>
          <div>
            <p className="font-medium text-zinc-800 dark:text-zinc-100">
              Browser preview unavailable
            </p>
            <p className="mt-0.5 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              Angular code is stored with the template and remains available through the API and code export.
            </p>
          </div>
        </div>
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

function PreviewHeader({ label }: { label: string }) {
  return (
    <p className="flex h-9 items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
      <span className="grid size-8 place-items-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
        <EditorIcon name="eye" />
      </span>
      {label}
    </p>
  );
}
