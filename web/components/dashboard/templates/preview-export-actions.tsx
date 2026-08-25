"use client";

import { useState, type RefObject } from "react";
import { downloadUrl, previewImageFileName } from "@/features/templates/downloads";
import { renderPreviewImage } from "@/features/templates/image-export";

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
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1">
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
      </div>
      {exportError && <p className="max-w-sm text-right text-xs text-red-600 dark:text-red-400">{exportError}</p>}
      {exportWarning && (
        <p className="max-w-sm text-right text-xs text-amber-700 dark:text-amber-400">{exportWarning}</p>
      )}
    </div>
  );
}
