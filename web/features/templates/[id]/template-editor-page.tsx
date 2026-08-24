"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BlockInspector from "@/components/dashboard/templates/block-inspector";
import BlockPalette from "@/components/dashboard/templates/block-palette";
import CanvasPanel from "@/components/dashboard/templates/canvas-panel";
import CodeEditorPanel from "@/components/dashboard/templates/code-editor-panel";
import CodeOutput from "@/components/dashboard/templates/code-output";
import EditorCanvas from "@/components/dashboard/templates/editor-canvas";
import { blocksToAngular, blocksToHtml, blocksToReact } from "../codegen";
import {
  DEFAULT_CANVAS,
  createUniversalBlock,
  parseContent,
  workingCanvasSize,
  type BlockStyle,
  type CodeLang,
  type Template,
  type TemplateBlock,
  type TemplateCanvas,
} from "../types";
import { getTemplate, updateTemplate } from "../queries";

type PanelTab = "canvas" | "block";
type EditorMode = "wysiwyg" | "code";

export default function TemplateEditorPage({ templateId }: { templateId: string }) {
  const [mode, setMode] = useState<EditorMode>("wysiwyg");
  const [title, setTitle] = useState("");
  const [canvas, setCanvas] = useState<TemplateCanvas>(DEFAULT_CANVAS);
  const [blocks, setBlocks] = useState<TemplateBlock[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState<PanelTab>("canvas");
  const [lang, setLang] = useState<CodeLang>("html");
  const [codeBuffers, setCodeBuffers] = useState<
    Record<CodeLang, string>
  >({ html: "", react: "", angular: "" });
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getTemplate(templateId)
      .then((template) => {
        if (cancelled) return;
        setTitle(template.title);
        const parsed = parseContent(template.content);
        setCanvas(parsed.canvas);
        setBlocks(parsed.blocks);
        setMode(template.isCode ? "code" : "wysiwyg");
        setCodeBuffers({
          html: template.html ?? "",
          react: template.react ?? "",
          angular: template.angular ?? "",
        });
        setLang(
          template.isCode
            ? template.html
              ? "html"
              : template.react
                ? "react"
                : "angular"
            : "html"
        );
        setSavedAt(new Date(template.updatedAt).toLocaleString());
      })
      .catch((err: Error) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [templateId]);

  const selectedBlock = blocks.find((b) => b.id === selectedId) ?? null;

  const generated = useMemo(() => {
    return {
      html: blocksToHtml(blocks, canvas),
      react: blocksToReact(blocks, title || "Template", canvas),
      angular: blocksToAngular(blocks, title || "Template", canvas),
    };
  }, [blocks, title, canvas]);

  function markDirty() {
    setDirty(true);
  }

  function addBlockCentered() {
    const size = workingCanvasSize(canvas);
    const block = createUniversalBlock(
      (size.width - 280) / 2,
      (size.height - 44) / 2,
      "text",
      nextZ()
    );
    setBlocks((prev) => [...prev, block]);
    setSelectedId(block.id);
    setPanelTab("block");
    markDirty();
  }

  function addBlockAt(x: number, y: number) {
    const block = createUniversalBlock(x, y, "text", nextZ());
    setBlocks((prev) => [...prev, block]);
    setSelectedId(block.id);
    setPanelTab("block");
    markDirty();
  }

  function handleSelect(id: string | null) {
    setSelectedId((prev) => (prev === id ? prev : id));
    if (id !== null) setPanelTab("block");
  }

  function handleMove(id: string, x: number, y: number) {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, x, y } : b))
    );
    markDirty();
  }

  function handleResize(
    id: string,
    patch: { x?: number; y?: number; width: number; height: number }
  ) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    markDirty();
  }

  function patchSelected(patch: Partial<TemplateBlock>) {
    if (!selectedBlock) return;
    setBlocks((prev) =>
      prev.map((b) => (b.id === selectedBlock.id ? { ...b, ...patch } : b))
    );
    markDirty();
  }

  function patchSelectedStyle(patch: Partial<BlockStyle>) {
    if (!selectedBlock) return;
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === selectedBlock.id ? { ...b, style: { ...b.style, ...patch } } : b
      )
    );
    markDirty();
  }

  function patchCanvas(patch: Partial<TemplateCanvas>) {
    setCanvas((prev) => ({ ...prev, ...patch }));
    markDirty();
  }

  function nextZ() {
    return blocks.reduce((max, b) => Math.max(max, b.z), -1) + 1;
  }

  function handleDelete(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
    markDirty();
  }

  function stackBlock(id: string, dir: "front" | "back") {
    setBlocks((prev) => {
      if (!prev.some((b) => b.id === id)) return prev;
      const maxZ = prev.reduce((m, b) => Math.max(m, b.z), -1);
      const minZ = prev.reduce((m, b) => Math.min(m, b.z), Number.POSITIVE_INFINITY);
      const z = dir === "front" ? maxZ + 1 : Math.max(0, minZ - 1);
      return prev.map((b) => (b.id === id ? { ...b, z } : b));
    });
    markDirty();
  }

  // Figma-lite keyboard shortcuts: delete + arrow-key nudge (1px / Shift 10px)
  useEffect(() => {
    if (mode !== "wysiwyg") return;
    function isTyping(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
    }
    function onKey(e: KeyboardEvent) {
      if (!selectedId || isTyping(e.target)) return;
      const nudge = (dx: number, dy: number) => {
        e.preventDefault();
        setBlocks((prev) =>
          prev.map((b) =>
            b.id === selectedId ? { ...b, x: b.x + dx, y: b.y + dy } : b
          )
        );
        setDirty(true);
      };
      switch (e.key) {
        case "Delete":
        case "Backspace":
          e.preventDefault();
          setBlocks((prev) => prev.filter((b) => b.id !== selectedId));
          setSelectedId(null);
          setDirty(true);
          break;
        case "ArrowUp":
          nudge(0, e.shiftKey ? -10 : -1);
          break;
        case "ArrowDown":
          nudge(0, e.shiftKey ? 10 : 1);
          break;
        case "ArrowLeft":
          nudge(e.shiftKey ? -10 : -1, 0);
          break;
        case "ArrowRight":
          nudge(e.shiftKey ? 10 : 1, 0);
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, selectedId]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      let updated: Template;
      if (mode === "wysiwyg") {
        updated = await updateTemplate(templateId, {
          title,
          isCode: false,
          content: { version: 2, canvas, blocks },
          html: generated.html,
          react: generated.react,
          angular: generated.angular,
        });
      } else {
        updated = await updateTemplate(templateId, {
          title,
          isCode: true,
          [lang]: codeBuffers[lang] || null,
        });
      }
      setSavedAt(new Date(updated.updatedAt).toLocaleString());
      setDirty(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function handleRename(value: string) {
    setTitle(value);
    markDirty();
  }

  function handleCodeChange(langKey: CodeLang, value: string) {
    setCodeBuffers((prev) => ({ ...prev, [langKey]: value }));
    markDirty();
  }

  if (loading) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard/templates"
          className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          &larr; Templates
        </Link>
        <input
          value={title}
          onChange={(e) => handleRename(e.target.value)}
          aria-label="Template title"
          className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-xl font-semibold tracking-tight hover:border-zinc-300 focus:border-zinc-500 focus:outline-none dark:hover:border-zinc-700"
        />
        <div className="flex rounded-lg border border-zinc-300 p-0.5 dark:border-zinc-700">
          {(["wysiwyg", "code"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={
                "rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors " +
                (mode === m
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50")
              }
            >
              {m === "wysiwyg" ? "WYSIWYG" : "Code"}
            </button>
          ))}
        </div>
        {dirty && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
            Unsaved changes
          </span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <p className="-mt-4 text-xs text-zinc-400 dark:text-zinc-500">
        {savedAt ? `Last saved ${savedAt}` : "Not saved yet"}
        {mode === "wysiwyg" &&
          " · Drag to move, handles to resize, arrows to nudge, Delete to remove."}
        {mode === "code" &&
          " · Code mode saves the pasted HTML / React / Angular code; WYSIWYG blocks are kept untouched."}
      </p>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}

      {mode === "wysiwyg" ? (
        <>
          <div className="grid gap-4 lg:grid-cols-[11rem_minmax(0,1fr)_17rem]">
            <aside className="order-2 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:order-1">
              <BlockPalette onAdd={addBlockCentered} />
            </aside>

            <section className="order-1 min-h-96 lg:order-2">
              <EditorCanvas
                canvas={canvas}
                blocks={blocks}
                selectedId={selectedId}
                onSelect={handleSelect}
                onMove={handleMove}
                onResize={handleResize}
                onAddAt={addBlockAt}
                onDelete={handleDelete}
              />
            </section>

            <aside className="order-3 h-fit rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 grid grid-cols-2 gap-1">
                {(["canvas", "block"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setPanelTab(tab)}
                    className={
                      "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors " +
                      (panelTab === tab
                        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50")
                    }
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {panelTab === "canvas" ? (
                <CanvasPanel canvas={canvas} onChange={patchCanvas} />
              ) : (
                <BlockInspector
                  block={selectedBlock}
                  onChange={patchSelected}
                  onStyleChange={patchSelectedStyle}
                  onStack={(dir) => selectedBlock && stackBlock(selectedBlock.id, dir)}
                />
              )}
            </aside>
          </div>

          <CodeOutput
            html={generated.html}
            reactCode={generated.react}
            angularCode={generated.angular}
          />
        </>
      ) : (
        <CodeEditorPanel
          lang={lang}
          onLangChange={setLang}
          code={codeBuffers[lang]}
          onCodeChange={(value) => handleCodeChange(lang, value)}
        />
      )}
    </div>
  );
}
