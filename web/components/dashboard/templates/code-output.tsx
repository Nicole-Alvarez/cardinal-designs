"use client";

import { useRef, useState } from "react";
import { codeFileName, downloadTextFile } from "@/features/templates/downloads";
import { EditorIcon, EditorTooltip } from "./editor-controls";
import PreviewExportActions from "./preview-export-actions";
import { handleTabKeyboardNavigation } from "@/components/ui/tab-keyboard";

type Tab = "preview" | "html" | "react";

const OUTPUT_TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "preview", label: "Preview", icon: "eye" },
  { id: "html", label: "HTML", icon: "code-xml" },
  { id: "react", label: "React", icon: "atom" },
];

export default function CodeOutput({
  title,
  html,
  previewHtml,
  reactCode,
}: {
  title: string;
  html: string;
  previewHtml: string[];
  reactCode: string;
  angularCode: string;
}) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>("preview");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const code = tab === "html" ? html : reactCode;

  async function handleCopy() {
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      setCopied(false);
      setCopyError(
        error instanceof Error ? error.message : "Could not copy the code."
      );
    }
  }

  function handleDownloadCode() {
    if (tab === "preview") return;
    downloadTextFile(code, codeFileName(title, tab));
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-start gap-3 border-b border-zinc-200 bg-white/95 p-3 dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="flex h-9 shrink-0 items-center gap-2 px-1 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          <span className="grid size-8 place-items-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            <EditorIcon name="file-code" />
          </span>
          Output
        </div>

        <div
          role="tablist"
          aria-label="Template output"
          className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800/80"
        >
          {OUTPUT_TABS.map((outputTab, index) => (
            <button
              key={outputTab.id}
              type="button"
              role="tab"
              id={`output-tab-${outputTab.id}`}
              aria-controls={`output-panel-${outputTab.id}`}
              aria-selected={tab === outputTab.id}
              tabIndex={tab === outputTab.id ? 0 : -1}
              onClick={() => setTab(outputTab.id)}
              onKeyDown={(event) =>
                handleTabKeyboardNavigation(
                  event,
                  index,
                  OUTPUT_TABS.length,
                  (nextIndex) => setTab(OUTPUT_TABS[nextIndex].id)
                )
              }
              className={
                "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 " +
                (tab === outputTab.id
                  ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-700 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100")
              }
            >
              <EditorIcon name={outputTab.icon} className="size-3.5" />
              {outputTab.label}
            </button>
          ))}
          <button
            type="button"
            role="tab"
            id="output-tab-angular"
            aria-selected="false"
            aria-disabled="true"
            disabled
            tabIndex={-1}
            className="flex shrink-0 cursor-not-allowed items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-400 opacity-60 dark:text-zinc-500"
          >
            <EditorIcon name="triangle" className="size-3.5" />
            <span>Angular</span>
            <span className="text-[10px] font-normal">Coming soon</span>
          </button>
        </div>

        <div className="ml-auto flex shrink-0 items-start">
          {tab === "preview" ? (
            <PreviewExportActions title={title} previewRef={previewRef} />
          ) : (
            <div className="flex items-center gap-1 rounded-xl border border-zinc-200 p-1 dark:border-zinc-700">
              <EditorTooltip label={copied ? "Copied" : `Copy ${tab} code`} align="right">
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label={copied ? "Code copied" : `Copy ${tab} code`}
                  className="grid size-11 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white sm:size-9"
                >
                  <EditorIcon name={copied ? "check" : "copy"} />
                </button>
              </EditorTooltip>
              <EditorTooltip label={`Download ${tab} file`} align="right">
                <button
                  type="button"
                  onClick={handleDownloadCode}
                  aria-label={`Download ${tab} file`}
                  className="grid size-11 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white sm:size-9"
                >
                  <EditorIcon name="file-down" />
                </button>
              </EditorTooltip>
              <span className="sr-only" aria-live="polite">
                {copied ? "Code copied to clipboard" : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      {copyError ? (
        <p
          role="alert"
          className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300"
        >
          <EditorIcon name="circle-alert" className="size-4 shrink-0" />
          {copyError}
        </p>
      ) : null}

      {tab === "preview" ? (
        <div
          role="tabpanel"
          id="output-panel-preview"
          aria-labelledby="output-tab-preview"
          className="max-h-[32rem] overflow-auto bg-zinc-100/70 p-5 dark:bg-zinc-950/50"
        >
          <div className="w-fit rounded-xl border border-zinc-200/80 bg-white/60 p-3 shadow-inner dark:border-zinc-800 dark:bg-zinc-900/50">
            {/* Generated by our own codegen from editor inputs — all values escaped at generation time */}
            <div ref={previewRef}>
              <div data-template-preview-batch className="inline-flex flex-col gap-4 bg-white">
                {previewHtml.map((preview, index) => (
                  <div
                    key={index}
                    data-template-preview-card
                    dangerouslySetInnerHTML={{ __html: preview }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          role="tabpanel"
          id={`output-panel-${tab}`}
          aria-labelledby={`output-tab-${tab}`}
          className="bg-zinc-950 p-2"
        >
          <pre className="max-h-[32rem] overflow-auto rounded-xl p-4 font-mono text-xs leading-relaxed text-zinc-300 selection:bg-zinc-700">
            <code>{code}</code>
          </pre>
        </div>
      )}
    </section>
  );
}
