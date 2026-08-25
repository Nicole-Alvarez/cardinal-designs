"use client";

import React, { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import {
  extractReactPropPaths,
  resolveTemplateString,
  withReactPlaceholderFallbacks,
} from "@/features/templates/metadata";
import type { CodeLang, TemplateMetadata } from "@/features/templates/types";
import PreviewExportActions from "./preview-export-actions";

const LANGS: { value: CodeLang; label: string }[] = [
  { value: "html", label: "HTML" },
  { value: "react", label: "React" },
  { value: "angular", label: "Angular" },
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

  function closeConversionDialog() {
    setConversionDialogOpen(false);
    requestAnimationFrame(() => conversionButtonRef.current?.focus());
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={lang}
          onChange={(e) => onLangChange(e.target.value as CodeLang)}
          aria-label="Code language"
          className="rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
        >
          {LANGS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onOpenMetadata}
          data-template-selection-preserving
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Metadata ({metadata.length})
        </button>
        <button
          ref={conversionButtonRef}
          type="button"
          onClick={() => setConversionDialogOpen(true)}
          disabled={lang === "angular"}
          title={lang === "angular" ? "Angular conversion is not supported yet" : `Convert supported ${lang === "react" ? "React TSX" : "HTML"} into WYSIWYG blocks`}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:pointer-events-none disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Convert to WYSIWYG
        </button>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Paste your code — the preview below updates as you type.
        </p>
      </div>

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

      <textarea
        value={code}
        onChange={(e) => onCodeChange(e.target.value)}
        rows={14}
        spellCheck={false}
        placeholder={
          lang === "html"
            ? "<div>...</div>"
            : lang === "react"
              ? "export default function Template() {\n  return (...);\n}"
              : "@Component({ ... })\nexport class ... {}"
        }
        className="w-full rounded-xl border border-zinc-300 bg-white p-3 font-mono text-xs leading-relaxed text-zinc-800 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
      />

      {lang === "html" && code.trim() && (
        <section>
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            <PreviewHeader label="Preview (HTML)" />
            <PreviewExportActions title={title} previewRef={htmlPreviewRef} />
          </div>
          <div className="max-h-[32rem] overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
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
        </section>
      )}

      {lang === "react" && <ReactPreview title={title} code={code} metadata={metadata} />}

      {lang === "angular" && (
        <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
          Angular code can&apos;t be rendered in the browser preview. It is
          stored with the template and available via the API / export.
        </p>
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
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2
          id="conversion-disclaimer-title"
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          Convert {lang === "react" ? "React" : "HTML"} to WYSIWYG?
        </h2>
        <p
          id="conversion-disclaimer-description"
          className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300"
        >
          Code conversion is best-effort. WYSIWYG layout, fonts, spacing,
          effects, and unsupported custom code may differ from the original
          preview.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus:ring-offset-zinc-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:focus:ring-offset-zinc-900"
          >
            Continue conversion
          </button>
        </div>
      </section>
    </div>
  );
}

function PreviewHeader({ label }: { label: string }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
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
    <section>
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <PreviewHeader label="Preview (React)" />
        {PreviewComponent && !state.error && (
          <PreviewExportActions title={title} previewRef={previewRef} />
        )}
      </div>
      {state.error ? (
        <pre className="overflow-auto rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {state.error}
        </pre>
      ) : PreviewComponent ? (
        <div className="max-h-[32rem] overflow-auto rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
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
      ) : (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">Compiling…</p>
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
