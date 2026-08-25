"use client";

import React, { useEffect, useMemo, useState, type ComponentType } from "react";
import { resolveTemplateString } from "@/features/templates/metadata";
import type { CodeLang, TemplateMetadata } from "@/features/templates/types";

const LANGS: { value: CodeLang; label: string }[] = [
  { value: "html", label: "HTML" },
  { value: "react", label: "React" },
  { value: "angular", label: "Angular" },
];

export default function CodeEditorPanel({
  lang,
  onLangChange,
  code,
  onCodeChange,
  metadata,
  onOpenMetadata,
}: {
  lang: CodeLang;
  onLangChange: (lang: CodeLang) => void;
  code: string;
  onCodeChange: (value: string) => void;
  metadata: TemplateMetadata;
  onOpenMetadata: () => void;
}) {
  const previewCode = useMemo(
    () => resolveTemplateString(code, metadata),
    [code, metadata]
  );

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
          Metadata ({Object.keys(metadata).length})
        </button>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Paste your code — the preview below updates as you type.
        </p>
      </div>

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

      {lang === "html" && (
        <section>
          <PreviewHeader label="Preview (HTML)" />
          <div className="max-h-[32rem] overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
            {/* Rendered from user-pasted HTML in this single-admin editor */}
            <div dangerouslySetInnerHTML={{ __html: previewCode }} />
          </div>
        </section>
      )}

      {lang === "react" && <ReactPreview code={previewCode} metadata={metadata} />}

      {lang === "angular" && (
        <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
          Angular code can&apos;t be rendered in the browser preview. It is
          stored with the template and available via the API / export.
        </p>
      )}
    </div>
  );
}

function PreviewHeader({ label }: { label: string }) {
  return (
    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
      {label}
    </p>
  );
}

function ReactPreview({
  code,
  metadata,
}: {
  code: string;
  metadata: TemplateMetadata;
}) {
  const [state, setState] = useState<{
    Component?: ComponentType<Record<string, unknown>>;
    error?: string;
  }>({});

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
      <PreviewHeader label="Preview (React)" />
      {state.error ? (
        <pre className="overflow-auto rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {state.error}
        </pre>
      ) : state.Component ? (
        <div className="max-h-[32rem] overflow-auto rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <ErrorBoundary onError={(message) => setState({ error: message })}>
            <state.Component {...metadata} />
          </ErrorBoundary>
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
