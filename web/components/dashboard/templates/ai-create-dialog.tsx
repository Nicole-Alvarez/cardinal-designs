"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import AccessibleDialog from "@/components/ui/accessible-dialog";
import { Button } from "@/components/ui/button";
import { CanvasExportSurface } from "@/components/dashboard/templates/template-export-surface";
import { createAiLayout, createAiReferenceLayout } from "@/features/templates/queries";
import { workingCanvasSize, type TemplateCanvas, type TemplateContent } from "@/features/templates/types";
import { EditorIcon } from "./editor-controls";

const MAX_REFERENCE_BYTES = 4 * 1024 * 1024;
const REFERENCE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export default function AiCreateDialog({
  open, canvas, onClose, onApply,
}: {
  open: boolean;
  canvas: TemplateCanvas;
  onClose: () => void;
  onApply: (content: TemplateContent) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [draft, setDraft] = useState<TemplateContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<File | null>(null);
  const [mode, setMode] = useState<"match" | "inspiration">("match");
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const referenceUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (referenceUrlRef.current) URL.revokeObjectURL(referenceUrlRef.current);
    };
  }, []);

  const clearReference = useCallback(() => {
    if (referenceUrlRef.current) URL.revokeObjectURL(referenceUrlRef.current);
    referenceUrlRef.current = null;
    setReference(null);
    setReferenceUrl(null);
  }, []);

  function selectReference(file: File | null) {
    setError(null);
    setDraft(null);
    if (!file) {
      clearReference();
      return;
    }
    if (!REFERENCE_TYPES.has(file.type)) {
      clearReference();
      setError("Reference images must be PNG, JPEG, or WebP.");
      return;
    }
    if (file.size === 0 || file.size > MAX_REFERENCE_BYTES) {
      clearReference();
      setError("Reference image must be smaller than 4MB.");
      return;
    }
    clearReference();
    const url = URL.createObjectURL(file);
    referenceUrlRef.current = url;
    setReference(file);
    setReferenceUrl(url);
  }

  async function generate() {
    setLoading(true);
    setError(null);
    controller.current = new AbortController();
    try {
      setDraft(reference ? await createAiReferenceLayout(prompt, canvas, reference, mode, controller.current.signal) : await createAiLayout(prompt, canvas));
    } catch (cause) {
      setDraft(null);
      if ((cause as Error).name !== "AbortError") setError(cause instanceof Error ? cause.message : "AI Create failed");
    } finally {
      controller.current = null;
      setLoading(false);
    }
  }

  const close = useCallback(() => {
    if (loading) return;
    setDraft(null);
    setError(null);
    clearReference();
    controller.current?.abort();
    onClose();
  }, [clearReference, loading, onClose]);

  const draftCanvasSize = draft ? workingCanvasSize(draft.canvas) : null;
  const previewScale = draftCanvasSize ? Math.min(1, 420 / draftCanvasSize.width, 240 / draftCanvasSize.height) : 1;

  return (
    <AccessibleDialog open={open} onClose={close} labelledBy="ai-create-title" panelClassName="w-full max-w-xl rounded-2xl bg-surface-1 p-5 text-text-primary shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="ai-create-title" className="flex items-center gap-2 text-lg font-semibold"><EditorIcon name="sparkles" className="size-5 text-violet-600" /> Create with AI</h2>
          <p className="mt-1 text-sm text-text-secondary">Describe a card layout. You can review it before it replaces the current canvas.</p>
        </div>
        <button type="button" onClick={close} disabled={loading} aria-label="Close AI Create" className="rounded-md p-2 hover:bg-surface-2"><EditorIcon name="x" /></button>
      </div>
      {!draft ? <>
        <label className="mt-5 block text-sm font-medium" htmlFor="ai-create-prompt">Describe the card you want to create</label>
        <textarea id="ai-create-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={2000} rows={4} placeholder="Optional: explain what to preserve or change" className="mt-2 w-full rounded-lg border border-border-subtle bg-surface-0 p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-focus" />
        <div className="mt-3 flex items-center gap-3"><label className="cursor-pointer rounded-lg border border-border-subtle px-3 py-2 text-sm font-medium hover:bg-surface-2"><input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" aria-label={reference ? "Replace reference image" : "Upload reference image"} onChange={(event) => { const file = event.target.files?.[0] ?? null; event.target.value = ""; selectReference(file); }} />{reference ? "Replace reference" : "Upload reference image"}</label>{referenceUrl ? <><Image src={referenceUrl} alt="Reference preview" width={96} height={64} unoptimized className="h-16 w-24 rounded object-cover" /><button type="button" className="text-sm text-text-secondary underline" onClick={clearReference}>Remove</button></> : null}</div>
        {reference ? <div className="mt-3 flex rounded-lg border border-border-subtle p-1 text-sm"><button type="button" aria-pressed={mode === "match"} onClick={() => setMode("match")} className={`rounded px-3 py-1 ${mode === "match" ? "bg-surface-selected" : ""}`}>Match closely</button><button type="button" aria-pressed={mode === "inspiration"} onClick={() => setMode("inspiration")} className={`rounded px-3 py-1 ${mode === "inspiration" ? "bg-surface-selected" : ""}`}>Use as inspiration</button></div> : null}
        {error ? <p role="alert" className="mt-3 text-sm text-red-600">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2"><Button variant="ghost" onClick={close} disabled={loading}>Cancel</Button><Button onClick={() => void generate()} disabled={loading || (!prompt.trim() && !reference)}>{loading ? "Generating…" : reference ? "Analyze and generate" : "Generate layout"}</Button></div>
      </> : <>
        <div className="mt-5 rounded-lg border border-border-subtle bg-surface-2 p-4"><p className="font-medium">{draft.blocks.length} editable block{draft.blocks.length === 1 ? "" : "s"} generated</p><p className="mt-1 text-sm text-text-secondary">Images are empty image blocks so you can upload approved assets in the inspector.</p></div>
        {draftCanvasSize ? <div aria-label="Preview generated layout" className="mt-4 grid place-items-center overflow-auto rounded-lg border border-border-subtle bg-surface-0 p-4"><div style={{ width: draftCanvasSize.width * previewScale, height: draftCanvasSize.height * previewScale }}><div style={{ transform: `scale(${previewScale})`, transformOrigin: "top left", width: draftCanvasSize.width, height: draftCanvasSize.height }}><CanvasExportSurface content={draft} /></div></div></div> : null}
        <div className="mt-5 flex justify-end gap-2"><Button variant="ghost" onClick={() => setDraft(null)}>Back</Button><Button onClick={() => { onApply(draft); close(); }}>Apply layout</Button></div>
      </>}
    </AccessibleDialog>
  );
}
