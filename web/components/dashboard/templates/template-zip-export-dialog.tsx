"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { zipSync } from "fflate";
import AccessibleDialog from "@/components/ui/accessible-dialog";
import { Button } from "@/components/ui/button";
import { getCanvas } from "@/features/templates/canvas-queries";
import { downloadUrl } from "@/features/templates/downloads";
import { renderPreviewImage } from "@/features/templates/image-export";
import { createTemplateZipManifest, type TemplateZipItem, type ZipCanvasSource } from "@/features/templates/template-zip-export";
import { parseContent, workingCanvasSize, type CanvasSummary, type TemplateContent } from "@/features/templates/types";
import { EditorIcon } from "./editor-controls";
import { BlockExportSurface, CanvasExportSurface } from "./template-export-surface";

export default function TemplateZipExportDialog({ open, onClose, templateId, title, canvases, activeCanvasId, activeContent }: {
  open: boolean; onClose: () => void; templateId: string; title: string; canvases: CanvasSummary[]; activeCanvasId: string | null; activeContent: TemplateContent;
}) {
  const [sources, setSources] = useState<ZipCanvasSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState<string[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true); setError(null); setFailed([]);
    void Promise.all(canvases.map(async (summary) => {
      if (summary.id === activeCanvasId) return { ...summary, content: activeContent };
      const canvas = await getCanvas(templateId, summary.id);
      return { ...summary, content: parseContent(canvas.content) };
    })).then((next) => { if (!cancelled) setSources(next); })
      .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not load canvases for export."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, templateId, canvases, activeCanvasId, activeContent]);

  const manifest = useMemo(() => createTemplateZipManifest(title, sources), [title, sources]);
  function setNode(id: string, node: HTMLElement | null) { if (node) nodes.current.set(id, node); else nodes.current.delete(id); }

  async function downloadZip() {
    if (exporting || loading) return;
    setExporting(true); setError(null); setFailed([]);
    const entries: Record<string, Uint8Array> = {};
    const failures: string[] = [];
    try {
      for (const item of manifest.items) {
        const node = nodes.current.get(item.id);
        if (!node || !rootRef.current) { failures.push(item.path); continue; }
        try {
          const rendered = await renderPreviewImage(node, rootRef.current, { pixelRatio: 1, allowFontFallback: true });
          entries[item.path] = new Uint8Array(await (await fetch(rendered.dataUrl)).arrayBuffer());
        } catch { failures.push(item.path); }
      }
      if (failures.length) { setFailed(failures); return; }
      const blob = new Blob([zipSync(entries)], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      downloadUrl(url, manifest.zipFileName);
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create the ZIP."); }
    finally { setExporting(false); }
  }

  return <AccessibleDialog open={open} onClose={() => !exporting && onClose()} labelledBy="template-zip-title" panelClassName="flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-surface-1 shadow-2xl">
    <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4"><div><h2 id="template-zip-title" className="text-lg font-semibold">Download template ZIP</h2><p className="text-sm text-text-secondary">Every canvas and editable layer is exported as PNG.</p></div><button aria-label="Close ZIP export" onClick={onClose} disabled={exporting} className="p-2"><EditorIcon name="x" /></button></div>
    <div ref={rootRef} className="min-h-0 flex-1 overflow-auto p-5">
      {loading ? <p role="status">Loading canvases…</p> : null}
      {error ? <p role="alert" className="text-red-600">{error}</p> : null}
      {manifest.items.map((item) => <ExportRow key={item.id} item={item} setNode={setNode} />)}
      {failed.length ? <div role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">Could not render: {failed.join(", ")}. Check image/font access and retry.</div> : null}
    </div>
    <div className="flex justify-end gap-2 border-t border-border-subtle px-5 py-4"><Button variant="ghost" disabled={exporting} onClick={onClose}>Cancel</Button><Button disabled={loading || exporting || !manifest.items.length} onClick={() => void downloadZip()}>{exporting ? "Creating ZIP…" : failed.length ? "Retry ZIP export" : "Download ZIP"}</Button></div>
  </AccessibleDialog>;
}

function ExportRow({ item, setNode }: { item: TemplateZipItem; setNode: (id: string, node: HTMLElement | null) => void }) {
  const size = item.kind === "canvas" ? workingCanvasSize(item.canvas.content.canvas) : { width: item.block!.width, height: item.block!.height };
  const scale = Math.min(1, 220 / size.width, 120 / size.height);
  return <div className="mb-3 flex items-center gap-4 rounded-xl border border-border-subtle p-3"><div className="shrink-0 overflow-hidden rounded border bg-surface-2" style={{ width: size.width * scale, height: size.height * scale }}><div ref={(node) => setNode(item.id, node)} style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: size.width, height: size.height }}>{item.kind === "canvas" ? <CanvasExportSurface content={item.canvas.content} /> : <BlockExportSurface block={item.block!} />}</div></div><div className="min-w-0"><p className="font-medium">{item.kind === "canvas" ? item.canvas.title || "Canvas" : item.block?.text || item.block?.alt || item.block?.type}</p><p className="text-xs text-text-secondary">{item.kind === "canvas" ? "Complete canvas" : `${item.block?.type} layer`} · {item.path}</p></div></div>;
}
