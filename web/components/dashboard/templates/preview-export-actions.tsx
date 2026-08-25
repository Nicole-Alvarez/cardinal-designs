"use client";

import { useState, type RefObject } from "react";
import { downloadUrl, previewImageFileName } from "@/features/templates/downloads";
import { renderPreviewImage } from "@/features/templates/image-export";
import { EditorIcon, EditorTooltip } from "./editor-controls";

export default function PreviewExportActions({
  title,
  previewRef,
}: {
  title: string;
  previewRef: RefObject<HTMLElement | null>;
}) {
  const [exporting, setExporting] = useState<"print" | "png" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportWarning, setExportWarning] = useState<string | null>(null);

  function previewContainer(): HTMLElement {
    if (!previewRef.current) throw new Error("Preview is not ready yet.");
    return previewRef.current;
  }

  async function handleDownloadPng() {
    setExporting("png");
    setExportError(null);
    setExportWarning(null);
    try {
      const container = previewContainer();
      const batch = container.querySelector<HTMLElement>("[data-template-preview-batch]");
      if (!batch) throw new Error("Preview is not ready yet.");
      const rendered = await renderPreviewImage(batch, container, {
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
      const container = previewContainer();
      const cards = [...container.querySelectorAll<HTMLElement>("[data-template-preview-card]")];
      if (cards.length === 0) throw new Error("Preview is not ready yet.");
      const renderedCards = [];
      for (const card of cards) {
        renderedCards.push(
          await renderPreviewImage(card, container, {
            pixelRatio: 2,
            allowFontFallback: false,
          })
        );
      }
      const rendered = renderedCards[0];

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
      const document_ = printWindow.document;
      document_.open();
      document_.write(
        `<!doctype html><html><head><meta charset="utf-8"><title></title><style>@page { size: ${rendered.width}px ${rendered.height}px; margin: 0; } html, body { margin: 0; padding: 0; } .page { width: ${rendered.width}px; height: ${rendered.height}px; break-after: page; page-break-after: always; overflow: hidden; } .page:last-child { break-after: auto; page-break-after: auto; } img { display: block; width: 100%; height: 100%; }</style></head><body></body></html>`
      );
      document_.close();
      document_.title = title || "Template";
      const images = renderedCards.map((card, index) => {
        const page = document_.createElement("div");
        page.className = "page";
        const image = document_.createElement("img");
        image.alt = `${title || "Template"} preview ${index + 1}`;
        image.src = card.dataUrl;
        page.appendChild(image);
        document_.body.appendChild(page);
        return image;
      });
      await Promise.all(images.map((image) => image.decode()));
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

  return (
    <div className="flex min-w-0 flex-col items-end gap-2">
      <div className="flex items-center gap-1 rounded-xl border border-zinc-200 p-1 dark:border-zinc-700">
        <EditorTooltip
          label={exporting === "print" ? "Preparing print…" : "Print preview"}
          align="right"
        >
          <button
            type="button"
            onClick={handlePrint}
            disabled={exporting !== null}
            aria-label={exporting === "print" ? "Preparing print" : "Print preview"}
            className="grid size-8 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            <EditorIcon
              name={exporting === "print" ? "loader-circle" : "printer"}
              className={`size-4 ${exporting === "print" ? "animate-spin" : ""}`}
            />
          </button>
        </EditorTooltip>
        <EditorTooltip
          label={exporting === "png" ? "Exporting PNG…" : "Download preview as PNG"}
          align="right"
        >
          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={exporting !== null}
            aria-label={
              exporting === "png" ? "Exporting preview as PNG" : "Download preview as PNG"
            }
            className="grid size-8 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            <EditorIcon
              name={exporting === "png" ? "loader-circle" : "image-down"}
              className={`size-4 ${exporting === "png" ? "animate-spin" : ""}`}
            />
          </button>
        </EditorTooltip>
      </div>
      <span className="sr-only" aria-live="polite">
        {exporting === "print"
          ? "Preparing print preview"
          : exporting === "png"
            ? "Exporting preview as PNG"
            : ""}
      </span>
      {exportError && (
        <p
          role="alert"
          className="flex max-w-sm items-start gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-left text-xs text-red-600 dark:bg-red-950/60 dark:text-red-400"
        >
          <EditorIcon name="circle-alert" className="mt-0.5 size-3.5 shrink-0" />
          {exportError}
        </p>
      )}
      {exportWarning && (
        <p
          role="status"
          className="flex max-w-sm items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-left text-xs text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
        >
          <EditorIcon name="triangle-alert" className="mt-0.5 size-3.5 shrink-0" />
          {exportWarning}
        </p>
      )}
    </div>
  );
}
