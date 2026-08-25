"use client";

import React, { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import {
  extractReactPropPaths,
  resolveTemplateString,
  withReactPlaceholderFallbacks,
} from "@/features/templates/metadata";
import type { CodeLang, TemplateMetadata } from "@/features/templates/types";
import { EditorIcon, EditorTooltip } from "./editor-controls";
import PreviewExportActions from "./preview-export-actions";

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
  const htmlPreviewRef = useRef<HTMLDivElement>(null);
  const previewRecords = useMemo(() => (metadata.length > 0 ? metadata : [{}]), [metadata]);
  const htmlPreviews = useMemo(
    () => previewRecords.map((record) => resolveTemplateString(code, record)),
    [code, previewRecords]
  );
  const activeLanguage = LANGS.find((language) => language.value === lang) ?? LANGS[0];
  const lineCount = code ? code.split("\n").length : 0;

  function closeConversionDialog() {
    setConversionDialogOpen(false);
    requestAnimationFrame(() => conversionButtonRef.current?.focus());
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
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
            {LANGS.map((language) => (
              <button
                key={language.value}
                type="button"
                role="tab"
                aria-selected={lang === language.value}
                onClick={() => onLangChange(language.value)}
                className={
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 " +
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
            <EditorTooltip label="Preview metadata" align="right">
              <button
                type="button"
                onClick={onOpenMetadata}
                data-template-selection-preserving
                aria-label={`Preview metadata, ${metadata.length} records`}
                className="relative grid size-9 place-items-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
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
                  : `Convert ${lang === "react" ? "React TSX" : "HTML"} to WYSIWYG`
              }
              align="right"
            >
              <button
                ref={conversionButtonRef}
                type="button"
                onClick={() => setConversionDialogOpen(true)}
                disabled={lang === "angular"}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-zinc-950 px-3 text-xs font-medium text-white shadow-sm transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-900"
              >
                <EditorIcon name="wand-sparkles" />
                <span className="hidden sm:inline">Convert to WYSIWYG</span>
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
              lang === "html"
                ? "<div>...</div>"
                : lang === "react"
                  ? "export default function Template() {\n  return (...);\n}"
                  : "@Component({ ... })\nexport class ... {}"
            }
            className="min-h-72 w-full resize-y rounded-b-xl bg-zinc-950 p-4 font-mono text-xs leading-6 text-zinc-200 outline-none placeholder:text-zinc-700 focus:bg-zinc-900 selection:bg-blue-500/30"
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

      {lang === "html" && code.trim() && (
        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-zinc-200 p-3 dark:border-zinc-800">
            <PreviewHeader label="Preview (HTML)" />
            <PreviewExportActions title={title} previewRef={htmlPreviewRef} />
          </div>
          <div className="max-h-[32rem] overflow-auto bg-zinc-100/70 p-5 dark:bg-zinc-950/50">
            <div className="w-fit rounded-xl border border-zinc-200/80 bg-white/60 p-3 shadow-inner dark:border-zinc-800 dark:bg-zinc-900/50">
              {/* Rendered from user-pasted HTML in this single-admin editor */}
              <div ref={htmlPreviewRef}>
                <div data-template-preview-batch className="inline-flex flex-col gap-4 bg-white">
                  {htmlPreviews.map((html, index) => (
                    <div
                      key={index}
                      data-template-preview-card
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {lang === "react" && <ReactPreview title={title} code={code} metadata={metadata} />}

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
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

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
        aria-labelledby="conversion-disclaimer-title"
        aria-describedby="conversion-disclaimer-description"
        data-template-selection-preserving
        className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="flex items-start gap-3 border-b border-zinc-200 p-5 dark:border-zinc-800">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300">
            <EditorIcon name="wand-sparkles" />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="conversion-disclaimer-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Convert {lang === "react" ? "React" : "HTML"} to WYSIWYG?
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
            type="button"
            onClick={onClose}
            autoFocus
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
      </section>
    </div>
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

function ReactPreview({
  title,
  code,
  metadata,
}: {
  title: string;
  code: string;
  metadata: TemplateMetadata;
}) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<{
    Component?: ComponentType<Record<string, unknown>>;
    error?: string;
  }>({});
  const fields = useMemo(() => extractReactPropPaths(code), [code]);
  const PreviewComponent = state.Component;

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setState({});
      try {
        const Component = await compileReactComponent(code);
        if (!cancelled) setState({ Component });
      } catch (err) {
        if (!cancelled) setState({ error: (err as Error).message });
      }
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [code]);

  if (!code.trim()) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-zinc-200 p-3 dark:border-zinc-800">
        <PreviewHeader label="Preview (React)" />
        {PreviewComponent && !state.error && (
          <PreviewExportActions title={title} previewRef={previewRef} />
        )}
      </div>
      {state.error ? (
        <div role="alert" className="flex items-start gap-3 bg-red-50 p-4 text-red-700 dark:bg-red-950/50 dark:text-red-300">
          <EditorIcon name="circle-alert" className="mt-0.5 size-4 shrink-0" />
          <pre className="min-w-0 overflow-auto whitespace-pre-wrap text-xs leading-5">
            {state.error}
          </pre>
        </div>
      ) : PreviewComponent ? (
        <div className="max-h-[32rem] overflow-auto bg-zinc-100/70 p-5 dark:bg-zinc-950/50">
          <div className="w-fit rounded-xl border border-zinc-200/80 bg-white/60 p-3 shadow-inner dark:border-zinc-800 dark:bg-zinc-900/50">
            <div ref={previewRef}>
              <div data-template-preview-batch className="inline-flex flex-col gap-4 bg-white">
                {(metadata.length > 0 ? metadata : [{}]).map((record, index) => {
                  const props: Record<string, unknown> = withReactPlaceholderFallbacks(record, fields);
                  return (
                    <div key={index} data-template-preview-card>
                      <ErrorBoundary onError={(message) => setState({ error: message })}>
                        <PreviewComponent {...props} />
                      </ErrorBoundary>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p
          role="status"
          className="flex items-center gap-2 bg-zinc-50 p-4 text-xs text-zinc-500 dark:bg-zinc-950/40 dark:text-zinc-400"
        >
          <EditorIcon name="loader-circle" className="size-4 animate-spin" />
          Compiling React preview…
        </p>
      )}
    </section>
  );
}

async function compileReactComponent(
  source: string
): Promise<ComponentType<Record<string, unknown>>> {
  const Babel = await import("@babel/standalone");
  const transformed = Babel.transform(source, {
    filename: "template.tsx",
    presets: [
      ["react", { runtime: "classic" }],
      ["typescript", { ignoreExtensions: true }],
    ],
    plugins: ["transform-modules-commonjs"],
  }).code;
  if (!transformed) {
    throw new Error("Compilation produced no output");
  }

  const module_ = {
    exports: {} as { default?: ComponentType<Record<string, unknown>> },
  };
  new Function("module", "exports", "React", transformed)(
    module_,
    module_.exports,
    React
  );

  const Component = module_.exports.default;
  if (typeof Component !== "function") {
    throw new Error("Pasted code must `export default` a function component");
  }
  return Component;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (message: string) => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error.message);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}
