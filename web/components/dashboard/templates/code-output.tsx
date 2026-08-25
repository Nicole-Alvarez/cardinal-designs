"use client";

import { useRef, useState } from "react";
import {
  codeFileName,
  downloadTextFile,
  downloadUrl,
  previewImageFileName,
} from "@/features/templates/downloads";
import { renderPreviewImage } from "@/features/templates/image-export";

type Tab = "preview" | "html" | "react" | "angular";

export default function CodeOutput({
  title,
  html,
  reactCode,
  angularCode,
}: {
  title: string;
  html: string;
  reactCode: string;
  angularCode: string;
}) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>("preview");
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState<"print" | "png" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportWarning, setExportWarning] = useState<string | null>(null);

  const code =
    tab === "html" ? html : tab === "react" ? reactCode : angularCode;

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function previewElement(): HTMLElement {
    const element = previewRef.current?.querySelector<HTMLElement>(":scope > div");
    if (!element) throw new Error("Preview is not ready yet.");
    return element;
  }

  async function handleDownloadPng() {
    setExporting("png");
    setExportError(null);
    setExportWarning(null);
    try {
      const element = previewElement();
      if (!previewRef.current) throw new Error("Preview is not ready yet.");
      const rendered = await renderPreviewImage(element, previewRef.current, {
        pixelRatio: 1,
        allowFontFallback: true,
      });
      if (rendered.usedFallbackFonts) {
        setExportWarning("PNG exported with fallback fonts because a web font could not be embedded.");
      }
      downloadUrl(rendered.dataUrl, previewImageFileName(title));
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : "Could not export the preview. External images may require CORS access."
      );
    } finally {
      setExporting(null);
    }
  }

  async function handlePrint() {
    setExporting("print");
    setExportError(null);
    setExportWarning(null);
    let iframe: HTMLIFrameElement | null = null;
    let cleanupTimer: number | null = null;
    const cleanup = () => {
      if (cleanupTimer !== null) window.clearTimeout(cleanupTimer);
      iframe?.remove();
    };

    try {
      const element = previewElement();
      if (!previewRef.current) throw new Error("Preview is not ready yet.");
      const rendered = await renderPreviewImage(element, previewRef.current, {
        pixelRatio: 2,
        allowFontFallback: false,
      });

      iframe = document.createElement("iframe");
      iframe.setAttribute("aria-hidden", "true");
      iframe.style.position = "fixed";
      iframe.style.left = "-10000px";
      iframe.style.top = "0";
      iframe.style.width = "1px";
      iframe.style.height = "1px";
      iframe.style.border = "0";
      iframe.style.pointerEvents = "none";
      document.body.appendChild(iframe);

      const printWindow = iframe.contentWindow;
      if (!printWindow) throw new Error("Could not create the print document.");
      const doc = printWindow.document;
      doc.open();
      doc.write(
        `<!doctype html><html><head><meta charset="utf-8"><title></title><style>@page { size: ${rendered.width}px ${rendered.height}px; margin: 0; } html, body { width: ${rendered.width}px; height: ${rendered.height}px; margin: 0; padding: 0; } body { overflow: hidden; } img { display: block; width: ${rendered.width}px; height: ${rendered.height}px; }</style></head><body></body></html>`
      );
      doc.close();
      doc.title = title || "Template";
      const image = doc.createElement("img");
      image.alt = title || "Template preview";
      image.src = rendered.dataUrl;
      doc.body.appendChild(image);
      await image.decode();
      printWindow.addEventListener("afterprint", cleanup, { once: true });
      cleanupTimer = window.setTimeout(cleanup, 5 * 60 * 1000);
      printWindow.focus();
      printWindow.print();
    } catch (error) {
      cleanup();
      setExportError(error instanceof Error ? error.message : "Could not print the preview.");
    } finally {
      setExporting(null);
    }
  }

  function handleDownloadCode() {
    if (tab === "preview") return;
    downloadTextFile(code, codeFileName(title, tab));
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <div className="flex flex-wrap gap-1">
          {(["preview", "html", "react", "angular"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={
                "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors " +
                (tab === t
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50")
              }
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {tab === "preview" ? (
            <>
              <button
                type="button"
                onClick={handlePrint}
                disabled={exporting !== null}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                {exporting === "print" ? "Preparing…" : "Print"}
              </button>
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={exporting !== null}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                {exporting === "png" ? "Exporting…" : "Download PNG"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                type="button"
                onClick={handleDownloadCode}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Download file
              </button>
            </>
          )}
        </div>
      </div>

      {tab === "preview" ? (
        <div className="max-h-[32rem] overflow-auto bg-zinc-50 p-4 dark:bg-zinc-950/40">
          {/* Generated by our own codegen from editor inputs — all values escaped at generation time */}
          <div ref={previewRef} dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      ) : (
        <pre className="max-h-96 overflow-auto p-4 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
          <code>{code}</code>
        </pre>
      )}
      {exportError && (
        <p className="border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {exportError}
        </p>
      )}
      {exportWarning && (
        <p className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400">
          {exportWarning}
        </p>
      )}
    </div>
  );
}
