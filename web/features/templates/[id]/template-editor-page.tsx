"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BlockInspector from "@/components/dashboard/templates/block-inspector";
import CanvasPanel from "@/components/dashboard/templates/canvas-panel";
import CodeEditorPanel from "@/components/dashboard/templates/code-editor-panel";
import CodeOutput from "@/components/dashboard/templates/code-output";
import {
  EditorIcon,
  EditorTooltip,
} from "@/components/dashboard/templates/editor-controls";
import EditorCanvas from "@/components/dashboard/templates/editor-canvas";
import EditorCommands from "@/components/dashboard/templates/editor-commands";
import MetadataDialog from "@/components/dashboard/templates/metadata-dialog";
import TemplateEditorFooter from "@/components/dashboard/templates/template-editor-footer";
import { blocksToAngular, blocksToHtml, blocksToReact } from "../codegen";
import { GOOGLE_FONTS_URL } from "../fonts";
import {
  detectTemplateFields,
  metadataFieldCount,
} from "../metadata";
import { useTemplateHistory, type TemplateSnapshot } from "../use-history";
import { htmlCodeToWysiwyg, reactCodeToWysiwyg } from "../react-to-wysiwyg";
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
  type TemplateMetadata,
} from "../types";
import { getTemplate, updateTemplate } from "../queries";

type PanelTab = "commands" | "canvas" | "block";
type EditorMode = "wysiwyg" | "code";

export default function TemplateEditorPage({ templateId }: { templateId: string }) {
  const [mode, setMode] = useState<EditorMode>("wysiwyg");
  const [title, setTitle] = useState("");
  const [canvas, setCanvas] = useState<TemplateCanvas>(DEFAULT_CANVAS);
  const [blocks, setBlocks] = useState<TemplateBlock[]>([]);
  const [previewMetadata, setPreviewMetadata] = useState<TemplateMetadata>([]);
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
  const [showSpacing, setShowSpacing] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(8);
  const history = useTemplateHistory();

  useEffect(() => {
    history.setCurrent({ blocks, canvas, title });
  });

  function snapshot(): TemplateSnapshot {
    return { blocks, canvas, title };
  }

  function checkpoint(tag: string) {
    history.checkpoint(snapshot(), tag);
  }

  function applySnapshot(s: TemplateSnapshot) {
    setBlocks(s.blocks);
    setCanvas(s.canvas);
    setTitle(s.title);
    markDirty();
  }

  function handleUndo() {
    if (mode !== "wysiwyg") return;
    const s = history.undo();
    if (s) applySnapshot(s);
  }

  function handleRedo() {
    if (mode !== "wysiwyg") return;
    const s = history.redo();
    if (s) applySnapshot(s);
  }

  useEffect(() => {
    let cancelled = false;
    getTemplate(templateId)
      .then((template) => {
        if (cancelled) return;
        setTitle(template.title);
        const parsed = parseContent(template.content);
        setCanvas(parsed.canvas);
        setBlocks(parsed.blocks);
        setPreviewMetadata([]);
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

  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
  const selectedBlock = blocks.find((b) => b.id === selectedId) ?? null;

  const generated = useMemo(() => {
    return {
      html: blocksToHtml(blocks, canvas),
      previewHtml: (previewMetadata.length > 0 ? previewMetadata : [{}]).map((record) =>
        blocksToHtml(blocks, canvas, record)
      ),
      react: blocksToReact(blocks, title || "Template", canvas),
      angular: blocksToAngular(blocks, title || "Template", canvas),
    };
  }, [blocks, title, canvas, previewMetadata]);

  const detectedMetadataPaths = useMemo(
    () => {
      if (mode === "wysiwyg") return detectTemplateFields(blocks);
      return detectTemplateFields([], {
        html: lang === "html" ? codeBuffers.html : "",
        react: lang === "react" ? codeBuffers.react : "",
        angular: lang === "angular" ? codeBuffers.angular : "",
      });
    },
    [mode, blocks, codeBuffers, lang]
  );

  function markDirty() {
    setDirty(true);
  }

  function addBlockCentered() {
    const size = workingCanvasSize(canvas);
    checkpoint("add");
    const block = createUniversalBlock(
      (size.width - 280) / 2,
      (size.height - 44) / 2,
      "text",
      nextZ()
    );
    setBlocks((prev) => [...prev, block]);
    setSelectedIds([block.id]);
    setPanelTab("block");
    markDirty();
  }

  function addBlockAt(x: number, y: number) {
    checkpoint("add");
    const block = createUniversalBlock(x, y, "text", nextZ());
    setBlocks((prev) => [...prev, block]);
    setSelectedIds([block.id]);
    setPanelTab("block");
    markDirty();
  }

  function handleSelect(id: string | null, additive = false) {
    if (id === null) {
      setSelectedIds([]);
      setPanelTab("canvas");
      return;
    }

    setSelectedIds((prev) => {
      if (!additive) return [id];
      return prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id];
    });
    setPanelTab("block");
  }

  function handleSelectAll() {
    setSelectedIds((prev) => (prev.length === blocks.length ? [] : blocks.map((block) => block.id)));
    setPanelTab(blocks.length === 1 ? "block" : "canvas");
  }

  function handleMove(id: string, x: number, y: number) {
    checkpoint(`move:${id}`);
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, x, y } : b))
    );
    markDirty();
  }

  function handleResize(
    id: string,
    patch: { x?: number; y?: number; width: number; height: number }
  ) {
    checkpoint(`resize:${id}`);
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    markDirty();
  }

  function patchSelected(patch: Partial<TemplateBlock>) {
    if (!selectedBlock) return;
    checkpoint(`insp:${selectedBlock.id}`);
    setBlocks((prev) =>
      prev.map((b) => (b.id === selectedBlock.id ? { ...b, ...patch } : b))
    );
    markDirty();
  }

  function patchSelectedStyle(patch: Partial<BlockStyle>) {
    if (!selectedBlock) return;
    checkpoint(`insp:${selectedBlock.id}`);
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === selectedBlock.id ? { ...b, style: { ...b.style, ...patch } } : b
      )
    );
    markDirty();
  }

  function patchCanvas(patch: Partial<TemplateCanvas>) {
    checkpoint("canvas");
    setCanvas((prev) => ({ ...prev, ...patch }));
    markDirty();
  }

  function nextZ() {
    return blocks.reduce((max, b) => Math.max(max, b.z), -1) + 1;
  }

  function handleDelete(id: string) {
    checkpoint("delete");
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
    markDirty();
  }

  function stackBlock(id: string, dir: "front" | "back") {
    checkpoint(`stack:${id}`);
    setBlocks((prev) => {
      if (!prev.some((b) => b.id === id)) return prev;
      const maxZ = prev.reduce((m, b) => Math.max(m, b.z), -1);
      const minZ = prev.reduce((m, b) => Math.min(m, b.z), Number.POSITIVE_INFINITY);
      const z = dir === "front" ? maxZ + 1 : Math.max(0, minZ - 1);
      return prev.map((b) => (b.id === id ? { ...b, z } : b));
    });
    markDirty();
  }

  // Figma-lite keyboard shortcuts: undo/redo, delete, arrow-key nudge (1px / Shift 10px)
  useEffect(() => {
    if (mode !== "wysiwyg") return;
    function isTyping(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
    }
    function onKey(e: KeyboardEvent) {
      if (isTyping(e.target)) return;

      // undo/redo work regardless of selection
      const mod = e.metaKey || e.ctrlKey;
      if (mod && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        handleSelectAll();
        return;
      }
      if (mod && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }
      if (e.ctrlKey && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (!mod && !e.shiftKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        setShowSpacing((prev) => !prev);
        return;
      }

      if (!selectedId) return;
      const nudge = (dx: number, dy: number) => {
        e.preventDefault();
        checkpoint("nudge");
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
          checkpoint("delete");
          setBlocks((prev) => prev.filter((b) => b.id !== selectedId));
          setSelectedIds([]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers close over latest state each render
  }, [mode, selectedId, selectedIds, blocks, canvas, title]);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (selectedIds.length === 0 || !(e.target instanceof Element)) return;
      if (e.target.closest("[data-template-selection-preserving]")) return;
      setSelectedIds([]);
      setPanelTab("canvas");
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [selectedIds.length]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      let updated: Template;
      if (mode === "wysiwyg") {
        updated = await updateTemplate(templateId, {
          title,
          isCode: false,
          content: { version: 4, canvas, blocks, metadata: [] },
          html: generated.html,
          react: generated.react,
          angular: generated.angular,
        });
      } else {
        updated = await updateTemplate(templateId, {
          title,
          isCode: true,
          content: { version: 4, canvas, blocks, metadata: [] },
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
    checkpoint("rename");
    setTitle(value);
    markDirty();
  }

  function handleCodeChange(langKey: CodeLang, value: string) {
    setCodeBuffers((prev) => ({ ...prev, [langKey]: value }));
    markDirty();
  }

  function handleMetadataSave(nextMetadata: TemplateMetadata) {
    setPreviewMetadata(nextMetadata);
  }

  async function handleConvertToWysiwyg() {
    setError(null);
    try {
      checkpoint("convert-code");
      if (lang === "react") {
        const converted = await reactCodeToWysiwyg(codeBuffers.react, blocks, canvas);
        setCanvas(converted.canvas);
        setBlocks(converted.blocks);
      } else if (lang === "html") {
        const converted = htmlCodeToWysiwyg(codeBuffers.html);
        setCanvas(converted.canvas);
        setBlocks(converted.blocks);
      } else {
        throw new Error("Angular conversion is not supported yet.");
      }
      setSelectedIds([]);
      setPanelTab("canvas");
      setMode("wysiwyg");
      markDirty();
    } catch (err) {
      setError(`Could not convert to WYSIWYG: ${(err as Error).message}`);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>;
  }

  return (
    <>
      <div className="mx-auto flex h-[calc(100dvh-6.75rem)] w-full max-w-7xl flex-col gap-4 overflow-hidden md:h-[calc(100dvh-3rem)]">
        {GOOGLE_FONTS_URL && <link rel="stylesheet" href={GOOGLE_FONTS_URL} />}
        <header className="sticky top-0 z-40 shrink-0 overflow-visible rounded-2xl border border-zinc-200 bg-white/95 shadow-md backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
        <div
          role="toolbar"
          aria-label="Template editor toolbar"
          className="flex flex-wrap items-center gap-2 p-2.5"
        >
          <EditorTooltip label="Back to templates" align="left">
            <Link
              href="/dashboard/templates"
              aria-label="Back to templates"
              className="grid size-9 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              <EditorIcon name="arrow-left" />
            </Link>
          </EditorTooltip>

          <span className="hidden h-6 w-px bg-zinc-200 dark:bg-zinc-700 sm:block" />

          <input
            value={title}
            onChange={(e) => handleRename(e.target.value)}
            aria-label="Template title"
            className="min-w-48 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-lg font-semibold tracking-tight transition-colors hover:border-zinc-200 focus:border-zinc-300 focus:bg-white focus:outline-none dark:hover:border-zinc-700 dark:focus:border-zinc-600 dark:focus:bg-zinc-950"
          />

          <div className="flex items-center rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800/80">
            {(["wysiwyg", "code"] as const).map((m) => {
              const visualMode = m === "wysiwyg";
              return (
                <EditorTooltip
                  key={m}
                  label={visualMode ? "Visual editor" : "Code editor"}
                >
                  <button
                    type="button"
                    onClick={() => setMode(m)}
                    aria-pressed={mode === m}
                    className={
                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 " +
                      (mode === m
                        ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-700 dark:text-white"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100")
                    }
                  >
                    <EditorIcon name={visualMode ? "layout-template" : "code-2"} />
                    {visualMode ? "WYSIWYG" : "Code"}
                  </button>
                </EditorTooltip>
              );
            })}
          </div>

          <span className="hidden h-6 w-px bg-zinc-200 dark:bg-zinc-700 sm:block" />

          <EditorTooltip
            label={
              selectedIds.length === blocks.length && blocks.length > 0
                ? "Clear block selection"
                : "Select all blocks"
            }
          >
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={blocks.length === 0}
              data-template-selection-preserving
              aria-label={
                selectedIds.length === blocks.length && blocks.length > 0
                  ? "Clear block selection"
                  : "Select all blocks"
              }
              className="grid size-9 place-items-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-35 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              <EditorIcon
                name={
                  selectedIds.length === blocks.length && blocks.length > 0
                    ? "square-check"
                    : "box-select"
                }
              />
            </button>
          </EditorTooltip>

          <div className="flex items-center rounded-xl border border-zinc-200 p-1 dark:border-zinc-700">
            <EditorTooltip label="Undo (⌘Z)">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!history.canUndo}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-35 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                Undo
              </button>
            </EditorTooltip>
            <EditorTooltip label="Redo (⇧⌘Z)">
              <button
                type="button"
                onClick={handleRedo}
                disabled={!history.canRedo}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-35 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                Redo
              </button>
            </EditorTooltip>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <EditorTooltip label={saving ? "Saving template" : "Save template"} align="right">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex h-9 items-center gap-2 rounded-lg bg-zinc-950 px-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-900"
              >
                <EditorIcon
                  name={saving ? "loader-circle" : "save"}
                  className={`size-4 ${saving ? "animate-spin" : ""}`}
                />
                {saving ? "Saving..." : "Save"}
              </button>
            </EditorTooltip>
          </div>
        </div>
        </header>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-0.5 py-0.5 scroll-smooth">
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              {error}
            </p>
          )}

          {mode === "wysiwyg" ? (
            <>
              <div className="grid gap-4 lg:h-[70vh] lg:grid-cols-4">
            <section className="min-h-96 lg:col-span-3 lg:h-full lg:min-h-0">
              <EditorCanvas
                canvas={canvas}
                blocks={blocks}
                selectedIds={selectedIds}
                onSelect={handleSelect}
                onMove={handleMove}
                onResize={handleResize}
                onAddAt={addBlockAt}
                onDelete={handleDelete}
                showSpacing={showSpacing}
                onShowSpacingChange={setShowSpacing}
                showGrid={showGrid}
                onShowGridChange={setShowGrid}
                gridSize={gridSize}
                onGridSizeChange={setGridSize}
              />
            </section>

            <aside
              data-template-selection-preserving
              className="h-fit overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-1 lg:flex lg:h-full lg:min-h-0 lg:flex-col"
            >
              <div
                role="tablist"
                aria-label="Editor panels"
                className="grid shrink-0 grid-cols-3 gap-1 border-b border-zinc-100 bg-zinc-50/80 p-1.5 dark:border-zinc-800 dark:bg-zinc-950/40"
              >
                {(
                  [
                    { id: "commands", label: "Commands", icon: "command" },
                    { id: "canvas", label: "Canvas", icon: "panels-top-left" },
                    { id: "block", label: "Block", icon: "box" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`editor-tab-${tab.id}`}
                    aria-controls={`editor-panel-${tab.id}`}
                    aria-selected={panelTab === tab.id}
                    onClick={() => setPanelTab(tab.id)}
                    className={
                      "flex min-w-0 flex-col items-center gap-1 rounded-xl px-1.5 py-2 text-[11px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 " +
                      (panelTab === tab.id
                        ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                        : "text-zinc-400 hover:bg-white/70 hover:text-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200")
                    }
                  >
                    <EditorIcon name={tab.icon} className="size-4" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                ))}
              </div>

              <div
                role="tabpanel"
                id={`editor-panel-${panelTab}`}
                aria-labelledby={`editor-tab-${panelTab}`}
                className="p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto"
              >
                {panelTab === "commands" && (
                  <EditorCommands
                    onAdd={addBlockCentered}
                    onMetadata={() => setMetadataOpen(true)}
                    metadataCount={metadataFieldCount(previewMetadata)}
                  />
                )}
                {panelTab === "canvas" && (
                  <CanvasPanel canvas={canvas} onChange={patchCanvas} />
                )}
                {panelTab === "block" && (
                  <BlockInspector
                    block={selectedBlock}
                    selectedCount={selectedIds.length}
                    onChange={patchSelected}
                    onStyleChange={patchSelectedStyle}
                    onStack={(dir) => selectedBlock && stackBlock(selectedBlock.id, dir)}
                  />
                )}
              </div>
            </aside>
          </div>

              <CodeOutput
                title={title}
                html={generated.html}
                previewHtml={generated.previewHtml}
                reactCode={generated.react}
                angularCode={generated.angular}
              />
            </>
          ) : (
            <CodeEditorPanel
              title={title}
              lang={lang}
              onLangChange={setLang}
              code={codeBuffers[lang]}
              onCodeChange={(value) => handleCodeChange(lang, value)}
              metadata={previewMetadata}
              onOpenMetadata={() => setMetadataOpen(true)}
              onConvertToWysiwyg={handleConvertToWysiwyg}
            />
          )}
        </div>

        <TemplateEditorFooter
          mode={mode}
          lang={lang}
          blockCount={blocks.length}
          metadataRecordCount={previewMetadata.length}
          dirty={dirty}
          saving={saving}
          savedAt={savedAt}
        />
      </div>

      <MetadataDialog
        open={metadataOpen}
        metadata={previewMetadata}
        detectedPaths={detectedMetadataPaths}
        onClose={() => setMetadataOpen(false)}
        onSave={handleMetadataSave}
      />
    </>
  );
}
