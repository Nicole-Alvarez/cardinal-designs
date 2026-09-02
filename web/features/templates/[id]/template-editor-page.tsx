"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BlockInspector from "@/components/dashboard/templates/block-inspector";
import CanvasPanel from "@/components/dashboard/templates/canvas-panel";
import CodeEditorPanel from "@/components/dashboard/templates/code-editor-panel";
import ConfirmDialog from "@/components/dashboard/templates/confirm-dialog";
import {
  EditorIcon,
} from "@/components/dashboard/templates/editor-controls";
import EditorCanvas from "@/components/dashboard/templates/editor-canvas";
import EditorCommands from "@/components/dashboard/templates/editor-commands";
import EditorToolbar from "@/components/dashboard/templates/editor-toolbar";
import MetadataDialog from "@/components/dashboard/templates/metadata-dialog";
import MobileEditorActions, {
  type MobileEditorAction,
} from "@/components/dashboard/templates/mobile-editor-actions";
import PreviewDialog from "@/components/dashboard/templates/preview-dialog";
import AiCreateDialog from "@/components/dashboard/templates/ai-create-dialog";
import AiImageDialog from "@/components/dashboard/templates/ai-image-dialog";
import TemplateZipExportDialog from "@/components/dashboard/templates/template-zip-export-dialog";
import CanvasSelector from "@/components/dashboard/templates/canvas-selector";
import SettingsDialog from "@/components/dashboard/templates/settings-dialog";
import WorkspaceSheet from "@/components/dashboard/templates/workspace-sheet";
import { handleTabKeyboardNavigation } from "@/components/ui/tab-keyboard";
import { blocksToAngular, blocksToHtml, blocksToReact } from "../codegen";
import { GOOGLE_FONTS_URL } from "../fonts";
import {
  detectTemplateFields,
  metadataFieldCount,
} from "../metadata";
import {
  useCodeHistory,
  useTemplateHistory,
  type CodeSnapshot,
  type TemplateSnapshot,
} from "../use-history";
import { htmlCodeToWysiwyg, reactCodeToWysiwyg } from "../react-to-wysiwyg";
import {
  DEFAULT_CANVAS,
  createUniversalBlock,
  parseContent,
  workingCanvasSize,
  type BlockStyle,
  type BlockType,
  type CodeLang,
  type CanvasSummary,
  type TemplateBlock,
  type TemplateCanvas,
  type TemplateMetadata,
} from "../types";
import { createTemplate, generateAiImageBlock, getTemplate, updateTemplate } from "../queries";
import {
  listCanvases,
  getCanvas,
  createCanvas,
  updateCanvas,
  deleteCanvas,
} from "../canvas-queries";

type PanelTab = "commands" | "canvas" | "block";
type EditorMode = "wysiwyg" | "code";

export default function TemplateEditorPage({ templateId }: { templateId: string }) {
  const router = useRouter();
  const isDraft = templateId === "new";
  const [mode, setMode] = useState<EditorMode>("wysiwyg");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [canvases, setCanvases] = useState<CanvasSummary[]>([]);
  const [activeCanvasId, setActiveCanvasId] = useState<string | null>(null);
  const [canvas, setCanvas] = useState<TemplateCanvas>(DEFAULT_CANVAS);
  const [blocks, setBlocks] = useState<TemplateBlock[]>([]);
  const [previewMetadata, setPreviewMetadata] = useState<TemplateMetadata>([]);
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [aiCreateOpen, setAiCreateOpen] = useState(false);
  const [aiImageOpen, setAiImageOpen] = useState(false);
  const [zipExportOpen, setZipExportOpen] = useState(false);
  const [mobileAction, setMobileAction] = useState<MobileEditorAction | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [panelTab, setPanelTab] = useState<PanelTab>("canvas");
  const [lang, setLang] = useState<CodeLang>("html");
  const [codeBuffers, setCodeBuffers] = useState<
    Record<CodeLang, string>
  >({ html: "", react: "", angular: "" });
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSpacing, setShowSpacing] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(8);
  const [deleteCanvasOpen, setDeleteCanvasOpen] = useState(false);
  const [deleteCanvasTarget, setDeleteCanvasTarget] = useState<string | null>(null);
  const [creatingCanvas, setCreatingCanvas] = useState(false);
  const [aiImageStatus, setAiImageStatus] = useState<Record<string, "pending" | "generating" | "uploading" | "completed" | "failed">>({});
  const [aiImageErrors, setAiImageErrors] = useState<Record<string, string>>({});
  const history = useTemplateHistory();
  const codeHistory = useCodeHistory();

  useEffect(() => {
    history.setCurrent({ blocks, canvas, title, description });
  }, [history, blocks, canvas, title, description]);

  useEffect(() => {
    codeHistory.setCurrent(codeSnapshot());
  }, [codeHistory, codeBuffers, title, description]);

  function snapshot(): TemplateSnapshot {
    return { blocks, canvas, title, description };
  }

  function checkpoint(tag: string) {
    history.checkpoint(snapshot(), tag);
  }

  function codeSnapshot(): CodeSnapshot {
    return { codeBuffers, title, description };
  }

  function applySnapshot(s: TemplateSnapshot) {
    setBlocks(s.blocks);
    setCanvas(s.canvas);
    setTitle(s.title);
    setDescription(s.description);
    markDirty();
  }

  function applyCodeSnapshot(s: CodeSnapshot) {
    setCodeBuffers(s.codeBuffers);
    setTitle(s.title);
    setDescription(s.description);
    markDirty();
  }

  function handleUndo() {
    if (mode === "code") {
      const previous = codeHistory.undo();
      if (previous) applyCodeSnapshot(previous);
      return;
    }
    const snapshot = history.undo();
    if (snapshot) applySnapshot(snapshot);
  }

  function handleRedo() {
    if (mode === "code") {
      const next = codeHistory.redo();
      if (next) applyCodeSnapshot(next);
      return;
    }
    const snapshot = history.redo();
    if (snapshot) applySnapshot(snapshot);
  }

  const loadCanvasContent = useCallback(async (templateId: string, canvasId: string) => {
    const c = await getCanvas(templateId, canvasId);
    const parsed = parseContent(c.content);
    setCanvas(parsed.canvas);
    setBlocks(parsed.blocks);
    setCodeBuffers({
      html: c.html ?? "",
      react: c.react ?? "",
      angular: c.angular ?? "",
    });
    setLang(c.html ? "html" : c.react ? "react" : "html");
  }, []);

  const loadTemplate = useCallback(async () => {
    if (isDraft) {
      const now = new Date().toISOString();
      setCanvases([{ id: "draft-canvas", title: "Canvas", position: 0, createdAt: now, updatedAt: now }]);
      setActiveCanvasId("draft-canvas");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    setError(null);
    try {
      const template = await getTemplate(templateId);
      setTitle(template.title);
      setDescription(template.description);
      setIsPrivate(template.isPrivate);
      setMode(template.isCode ? "code" : "wysiwyg");

      const canvasList = await listCanvases(templateId);
      setCanvases(canvasList);

      if (canvasList.length > 0) {
        const first = canvasList[0];
        setActiveCanvasId(first.id);
        await loadCanvasContent(templateId, first.id);
      }
    } catch (err) {
      setLoadError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [loadCanvasContent, templateId, isDraft]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTemplate();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadTemplate]);

  useEffect(() => {
    if (!isDraft || !dirty) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }

    function handlePopState() {
      if (dirty && !window.confirm("You have unsaved changes. Leave anyway?")) {
        window.history.pushState(null, "", window.location.href);
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isDraft, dirty]);

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

  function addBlockCentered(type: BlockType) {
    const size = workingCanvasSize(canvas);
    checkpoint(`add:${type}`);
    const draft = createUniversalBlock(0, 0, type, nextZ());
    const block = {
      ...draft,
      x: Math.round((size.width - draft.width) / 2),
      y: Math.round((size.height - draft.height) / 2),
    };
    setBlocks((prev) => [...prev, block]);
    setSelectedIds([block.id]);
    setPanelTab("block");
    markDirty();
  }

  function addBlockAt(x: number, y: number, type: BlockType) {
    checkpoint(`add:${type}`);
    const draft = createUniversalBlock(0, 0, type, nextZ());
    const block = {
      ...draft,
      x: Math.round(x - draft.width / 2),
      y: Math.round(y - draft.height / 2),
    };
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

  function handleMobileAction(action: MobileEditorAction) {
    if (action === "preview") {
      setPreviewOpen(true);
      return;
    }
    setPanelTab(action === "add" ? "commands" : action);
    setMobileAction(action);
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
    function isTyping(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
    }
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;

      if (isTyping(e.target)) return;

      if (mode === "code") {
        if (mod && (e.key === "z" || e.key === "Z")) {
          e.preventDefault();
          if (e.shiftKey) handleRedo();
          else handleUndo();
        } else if (e.ctrlKey && (e.key === "y" || e.key === "Y")) {
          e.preventDefault();
          handleRedo();
        }
        return;
      }

      // undo/redo work regardless of selection
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
  }, [mode, selectedId, selectedIds, blocks, canvas, title, description]);

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
    if (!activeCanvasId) return;
    setSaving(true);
    setError(null);
    try {
      if (isDraft) {
        const created = await createTemplate({
          title: title || "Untitled",
          description,
          isPrivate,
          isCode: mode === "code",
        });
        const canvasId = created.canvases?.[0]?.id;
        if (!canvasId) throw new Error("Canvas was not created");
        await updateCanvas(created.id, canvasId, {
          content: { version: 4, canvas, blocks, metadata: [] },
          html: generated.html,
          react: generated.react,
          angular: generated.angular,
        });
        router.replace(`/dashboard/templates/${created.id}`);
      } else {
        await updateCanvas(templateId, activeCanvasId, {
          content: { version: 4, canvas, blocks, metadata: [] },
          html: generated.html,
          react: generated.react,
          angular: generated.angular,
        });
        await updateTemplate(templateId, {
          title,
          description,
          isPrivate,
          isCode: mode === "code",
        });
        setSavedAt(new Date().toLocaleString());
        setDirty(false);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function handleRename(value: string) {
    if (mode === "code") codeHistory.checkpoint(codeSnapshot(), "rename");
    else checkpoint("rename");
    setTitle(value);
    markDirty();
  }

  function handleDescriptionChange(value: string) {
    if (mode === "code") codeHistory.checkpoint(codeSnapshot(), "description");
    else checkpoint("description");
    setDescription(value);
    markDirty();
  }

  function handleCodeChange(langKey: CodeLang, value: string) {
    codeHistory.checkpoint(codeSnapshot(), `code:${langKey}`);
    setCodeBuffers((prev) => ({ ...prev, [langKey]: value }));
    markDirty();
  }

  function handleImportCode(importLang: "html" | "react", source: string) {
    codeHistory.checkpoint(codeSnapshot(), `import:${importLang}`);
    setLang(importLang);
    setCodeBuffers((prev) => ({ ...prev, [importLang]: source }));
    markDirty();
  }

  function handleMetadataSave(nextMetadata: TemplateMetadata) {
    setPreviewMetadata(nextMetadata);
  }

  function applyAiLayout(content: { canvas: TemplateCanvas; blocks: TemplateBlock[] }) {
    checkpoint("ai-create");
    setCanvas(content.canvas);
    setBlocks(content.blocks);
    setSelectedIds([]);
    setPanelTab("canvas");
    markDirty();
  }

  async function handleGenerateAiImage(prompt: string) {
    if (!selectedBlock || selectedBlock.type !== "image") return;
    if (isDraft || !activeCanvasId) {
      throw new Error("Save the template before generating AI images.");
    }
    if (dirty) {
      throw new Error("Save your layout changes before generating this image.");
    }
    setAiImageStatus((prev) => ({ ...prev, [selectedBlock.id]: "generating" }));
    setAiImageErrors((prev) => { const next = { ...prev }; delete next[selectedBlock.id]; return next; });
    try {
      const src = await generateAiImageBlock(templateId, activeCanvasId, selectedBlock.id, prompt);
      setBlocks((prev) => prev.map((block) => block.id === selectedBlock.id ? { ...block, src } : block));
      setAiImageStatus((prev) => ({ ...prev, [selectedBlock.id]: "completed" }));
      markDirty();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "AI image generation failed";
      setAiImageStatus((prev) => ({ ...prev, [selectedBlock.id]: "failed" }));
      setAiImageErrors((prev) => ({ ...prev, [selectedBlock.id]: message }));
      throw new Error(message);
    }
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
      setError(`Could not convert to Visual: ${(err as Error).message}`);
    }
  }

  async function handleAddCanvas() {
    if (creatingCanvas || isDraft) return;
    setCreatingCanvas(true);
    try {
      const newCanvas = await createCanvas(templateId);
      setCanvases((prev) => [...prev, newCanvas]);
      await handleSwitchCanvas(newCanvas.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreatingCanvas(false);
    }
  }

  async function handleSwitchCanvas(canvasId: string) {
    if (canvasId === activeCanvasId || isDraft) return;

    if (activeCanvasId && dirty) {
      try {
        await updateCanvas(templateId, activeCanvasId, {
          content: { version: 4, canvas, blocks, metadata: [] },
          html: generated.html,
          react: generated.react,
          angular: generated.angular,
        });
      } catch (err) {
        setError((err as Error).message);
        return;
      }
    }

    try {
      await loadCanvasContent(templateId, canvasId);
      setActiveCanvasId(canvasId);
      setSelectedIds([]);
      setPanelTab("canvas");
      setDirty(false);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function handleRenameCanvas(canvasId: string, newTitle: string) {
    setCanvases((prev) =>
      prev.map((c) => (c.id === canvasId ? { ...c, title: newTitle } : c))
    );
    if (!isDraft) {
      updateCanvas(templateId, canvasId, { title: newTitle }).catch((err) => {
        setError((err as Error).message);
      });
    }
  }

  function handleDeleteCanvasRequest(canvasId: string) {
    setDeleteCanvasTarget(canvasId);
    setDeleteCanvasOpen(true);
  }

  async function confirmDeleteCanvas() {
    if (!deleteCanvasTarget) return;
    try {
      await deleteCanvas(templateId, deleteCanvasTarget);
      const remaining = canvases.filter((c) => c.id !== deleteCanvasTarget);
      setCanvases(remaining);

      if (activeCanvasId === deleteCanvasTarget && remaining.length > 0) {
        await handleSwitchCanvas(remaining[0].id);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeleteCanvasOpen(false);
      setDeleteCanvasTarget(null);
    }
  }

  async function handleSettingsSave(patch: { title: string; description: string; isPrivate: boolean }) {
    try {
      await updateTemplate(templateId, patch);
      setTitle(patch.title);
      setDescription(patch.description);
      setIsPrivate(patch.isPrivate);
      setSettingsOpen(false);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (loading) {
    return (
      <div role="status" className="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <EditorIcon name="loader-circle" className="mx-auto size-6 animate-spin text-zinc-500" />
          <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Loading template…
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="grid min-h-dvh place-items-center p-6">
        <div
          role="alert"
          className="w-full max-w-md rounded-2xl bg-red-50 p-6 text-center dark:bg-red-950/40"
        >
          <EditorIcon name="cloud-off" className="mx-auto size-6 text-red-700 dark:text-red-300" />
          <h1 className="mt-4 text-lg font-semibold text-red-950 dark:text-red-100">
            Could not load template
          </h1>
          <p className="mt-1 text-sm leading-6 text-red-700 dark:text-red-300">
            {loadError}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link
              href="/dashboard/templates"
              className="inline-flex min-h-11 items-center rounded-lg px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 dark:text-red-200 dark:hover:bg-red-950"
            >
              Back to templates
            </Link>
            <button
              type="button"
              onClick={() => void loadTemplate()}
              className="min-h-11 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 dark:bg-red-600 dark:hover:bg-red-500"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col gap-3 px-2 sm:px-4 lg:h-dvh lg:min-h-0 lg:overflow-hidden lg:px-0">
        {GOOGLE_FONTS_URL && <link rel="stylesheet" href={GOOGLE_FONTS_URL} />}
        <EditorToolbar
          title={title}
          description={description}
          mode={mode}
          canUndo={mode === "code" ? codeHistory.canUndo : history.canUndo}
          canRedo={mode === "code" ? codeHistory.canRedo : history.canRedo}
          canSelectAll={mode === "wysiwyg" && blocks.length > 0}
          allSelected={blocks.length > 0 && selectedIds.length === blocks.length}
          previewDataCount={metadataFieldCount(previewMetadata)}
          dirty={dirty}
          saving={saving}
          savedAt={savedAt}
          onTitleCommit={handleRename}
          onDescriptionChange={handleDescriptionChange}
          onModeChange={setMode}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSelectAll={handleSelectAll}
          onPreviewData={() => setMetadataOpen(true)}
          onAiCreate={() => setAiCreateOpen(true)}
          onZipExport={() => setZipExportOpen(true)}
          onPreview={() => setPreviewOpen(true)}
          onSettings={() => setSettingsOpen(true)}
          onSave={handleSave}
          canvasSelector={
            canvases.length > 0 && activeCanvasId ? (
              <CanvasSelector
                canvases={canvases}
                activeCanvasId={activeCanvasId}
                addingCanvas={creatingCanvas}
                onSelect={handleSwitchCanvas}
                onAdd={handleAddCanvas}
                onRename={handleRenameCanvas}
                onDelete={handleDeleteCanvasRequest}
              />
            ) : null
          }
        />

        <main className="space-y-6 px-0.5 py-0.5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:scroll-smooth">
          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              {error}
            </p>
          )}

          {mode === "wysiwyg" ? (
            <>
              <div className="grid gap-4 lg:h-full lg:min-h-0 lg:grid-cols-4">
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
              className="hidden overflow-hidden rounded-xl border border-border-subtle bg-surface-1 lg:col-span-1 lg:flex lg:h-full lg:min-h-0 lg:flex-col"
            >
              <div
                role="tablist"
                aria-label="Editor panels"
                className="grid shrink-0 grid-cols-3 gap-1 border-b border-zinc-100 bg-zinc-50/80 p-1.5 dark:border-zinc-800 dark:bg-zinc-950/40"
              >
                {(
                  [
                    { id: "commands", label: "Add" },
                    { id: "canvas", label: "Canvas" },
                    { id: "block", label: "Block" },
                  ] as const
                ).map((tab, index, tabs) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`editor-tab-${tab.id}`}
                    aria-controls={`editor-panel-${tab.id}`}
                    aria-selected={panelTab === tab.id}
                    tabIndex={panelTab === tab.id ? 0 : -1}
                    onClick={() => setPanelTab(tab.id)}
                    onKeyDown={(event) =>
                      handleTabKeyboardNavigation(event, index, tabs.length, (nextIndex) =>
                        setPanelTab(tabs[nextIndex].id)
                      )
                    }
                    className={
                      "flex min-h-11 min-w-0 items-center justify-center rounded-xl px-2 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 sm:min-h-9 " +
                      (panelTab === tab.id
                        ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                        : "text-zinc-400 hover:bg-white/70 hover:text-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200")
                    }
                  >
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
                  <EditorCommands onAdd={addBlockCentered} />
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
                    onGenerateAiImage={() => setAiImageOpen(true)}
                    aiImageStatus={selectedBlock ? aiImageStatus[selectedBlock.id] : undefined}
                    aiImageError={selectedBlock ? aiImageErrors[selectedBlock.id] : null}
                  />
                )}
              </div>
            </aside>
          </div>
            </>
          ) : (
            <CodeEditorPanel
              lang={lang}
              code={codeBuffers[lang]}
              onCodeChange={(value) => handleCodeChange(lang, value)}
              metadata={previewMetadata}
              onOpenMetadata={() => setMetadataOpen(true)}
              onConvertToWysiwyg={handleConvertToWysiwyg}
              onImportCode={handleImportCode}
            />
          )}
        </main>

        {mode === "wysiwyg" ? (
          <MobileEditorActions active={mobileAction} onSelect={handleMobileAction} />
        ) : null}
      </div>

      {mode === "wysiwyg" ? (
        <WorkspaceSheet
          open={mobileAction !== null}
          title={
            mobileAction === "add"
              ? "Add blocks"
              : mobileAction === "block"
                ? "Edit block"
                : "Canvas"
          }
          placement="bottom"
          onClose={() => setMobileAction(null)}
        >
          {mobileAction === "add" ? (
            <EditorCommands onAdd={addBlockCentered} />
          ) : mobileAction === "block" ? (
            <BlockInspector
              block={selectedBlock}
              selectedCount={selectedIds.length}
              onChange={patchSelected}
              onStyleChange={patchSelectedStyle}
              onStack={(dir) => selectedBlock && stackBlock(selectedBlock.id, dir)}
              onGenerateAiImage={() => setAiImageOpen(true)}
              aiImageStatus={selectedBlock ? aiImageStatus[selectedBlock.id] : undefined}
              aiImageError={selectedBlock ? aiImageErrors[selectedBlock.id] : null}
            />
          ) : (
            <CanvasPanel canvas={canvas} onChange={patchCanvas} />
          )}
        </WorkspaceSheet>
      ) : null}

      <MetadataDialog
        open={metadataOpen}
        metadata={previewMetadata}
        detectedPaths={detectedMetadataPaths}
        onClose={() => setMetadataOpen(false)}
        onSave={handleMetadataSave}
      />

      <SettingsDialog
        open={settingsOpen}
        title={title}
        description={description}
        isPrivate={isPrivate}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSettingsSave}
      />

      <AiCreateDialog
        key={aiCreateOpen ? "ai-create-open" : "ai-create-closed"}
        open={aiCreateOpen}
        canvas={canvas}
        onClose={() => setAiCreateOpen(false)}
        onApply={applyAiLayout}
      />

      <AiImageDialog
        open={aiImageOpen}
        onClose={() => setAiImageOpen(false)}
        onGenerate={handleGenerateAiImage}
      />

      <TemplateZipExportDialog
        open={zipExportOpen}
        onClose={() => setZipExportOpen(false)}
        templateId={templateId}
        title={title}
        canvases={canvases}
        activeCanvasId={activeCanvasId}
        activeContent={{ version: 4, canvas, blocks, metadata: previewMetadata }}
      />

      <PreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={title}
        mode={mode}
        lang={lang}
        code={codeBuffers[lang]}
        metadata={previewMetadata}
        previewHtml={generated.previewHtml}
        html={generated.html}
        react={generated.react}
      />

      <ConfirmDialog
        open={deleteCanvasOpen}
        title="Delete canvas?"
        description="Are you sure you want to delete this canvas? This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={confirmDeleteCanvas}
        onCancel={() => {
          setDeleteCanvasOpen(false);
          setDeleteCanvasTarget(null);
        }}
      />
    </>
  );
}
