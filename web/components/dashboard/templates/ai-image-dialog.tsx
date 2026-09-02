"use client";

import { useEffect, useRef, useState } from "react";
import AccessibleDialog from "@/components/ui/accessible-dialog";
import { Button } from "@/components/ui/button";

export default function AiImageDialog({
  open, onClose, onGenerate,
}: {
  open: boolean;
  onClose: () => void;
  onGenerate: (prompt: string) => Promise<void>;
}) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (!open) { setPrompt(""); setError(null); } }, [open]);

  async function submit() {
    if (!prompt.trim()) { setError("Describe the image you want to generate."); return; }
    setLoading(true); setError(null);
    try { await onGenerate(prompt.trim()); onClose(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "AI image generation failed"); }
    finally { setLoading(false); }
  }

  return <AccessibleDialog open={open} onClose={() => { if (!loading) onClose(); }} labelledBy="ai-image-title" initialFocusRef={inputRef} panelClassName="w-full max-w-lg rounded-2xl bg-surface-1 p-5 text-text-primary shadow-2xl">
    <div className="flex items-start justify-between gap-3">
      <div><h2 id="ai-image-title" className="text-lg font-semibold">Generate image with AI</h2><p className="mt-1 text-sm text-text-secondary">Describe the image asset. Alt text remains separate accessibility content.</p></div>
      <button type="button" aria-label="Close AI image generation" disabled={loading} onClick={onClose} className="rounded-md p-2 hover:bg-surface-2">×</button>
    </div>
    <label className="mt-5 block text-sm font-medium" htmlFor="ai-image-prompt">Image description</label>
    <textarea ref={inputRef} id="ai-image-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={500} rows={4} placeholder="Minimal gold single-line goat-head emblem, transparent background, no text." className="mt-2 w-full rounded-lg border border-border-subtle bg-surface-0 p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-focus" />
    {error ? <p role="alert" className="mt-3 text-sm text-red-600">{error}</p> : null}
    <div className="mt-5 flex justify-end gap-2"><Button variant="ghost" disabled={loading} onClick={onClose}>Cancel</Button><Button disabled={loading} onClick={() => void submit()}>{loading ? "Generating…" : "Generate image"}</Button></div>
  </AccessibleDialog>;
}
