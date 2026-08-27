"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { EditorIcon } from "./editor-controls";
import type { CanvasSummary } from "@/features/templates/types";
import AccessibleDialog from "@/components/ui/accessible-dialog";

export default function CanvasSelector({
  canvases,
  activeCanvasId,
  addingCanvas = false,
  onSelect,
  onAdd,
  onRename,
  onDelete,
}: {
  canvases: CanvasSummary[];
  activeCanvasId: string;
  addingCanvas?: boolean;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const activeCanvas = canvases.find((c) => c.id === activeCanvasId);

  useEffect(() => {
    if (renamingId) renameInputRef.current?.focus();
  }, [renamingId]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: PointerEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setRenamingId(null);
      }
    }
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [open]);

  function startRename(canvas: CanvasSummary) {
    setRenamingId(canvas.id);
    setRenameValue(canvas.title);
    setOpen(false);
  }

  function commitRename() {
    if (renamingId && renameValue.trim()) {
      onRename(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
      >
        <EditorIcon name="rectangle-horizontal" className="size-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
        <span className="max-w-[120px] truncate">{activeCanvas?.title ?? "Canvas"}</span>
        <EditorIcon name="chevron-down" className="size-3 shrink-0 text-zinc-400 dark:text-zinc-500" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <div className="max-h-60 overflow-y-auto p-1">
            {canvases.map((canvas) => (
              <div
                key={canvas.id}
                className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                  canvas.id === activeCanvasId
                    ? "bg-zinc-100 dark:bg-zinc-800"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelect(canvas.id);
                    setOpen(false);
                  }}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <EditorIcon
                    name="rectangle-horizontal"
                    className="size-3.5 shrink-0 text-zinc-400 dark:text-zinc-500"
                  />
                  <span className="truncate text-sm text-zinc-700 dark:text-zinc-300">
                    {canvas.title}
                  </span>
                  {canvas.id === activeCanvasId && (
                    <EditorIcon name="check" className="size-3.5 shrink-0 text-zinc-900 dark:text-zinc-100" />
                  )}
                </button>

                <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => startRename(canvas)}
                    className="rounded p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    aria-label={`Rename ${canvas.title}`}
                  >
                    <EditorIcon name="pencil" className="size-3" />
                  </button>
                  {canvases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDelete(canvas.id)}
                      className="rounded p-0.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                      aria-label={`Delete ${canvas.title}`}
                    >
                      <EditorIcon name="trash-2" className="size-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-100 p-1 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => {
                onAdd();
                setOpen(false);
              }}
              disabled={addingCanvas}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-60 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
            >
              {addingCanvas ? (
                <EditorIcon name="loader-circle" className="size-3.5 animate-spin" />
              ) : (
                <EditorIcon name="plus" className="size-3.5" />
              )}
              {addingCanvas ? "Adding canvas..." : "Add canvas"}
            </button>
          </div>
        </div>
      )}

      {renamingId &&
        createPortal(
          <AccessibleDialog
            open
            onClose={() => setRenamingId(null)}
            labelledBy="rename-canvas-title"
            initialFocusRef={renameInputRef}
            overlayClassName="items-start justify-center p-4 pt-[10dvh]"
            panelClassName="w-80 rounded-2xl bg-white p-4 shadow-xl dark:bg-zinc-900"
          >
            <div>
              <label id="rename-canvas-title" htmlFor="rename-canvas-input" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Rename canvas
              </label>
              <input
                id="rename-canvas-input"
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") setRenamingId(null);
                }}
                className="mt-2 block min-h-11 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-base text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:text-zinc-100"
              />
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenamingId(null)}
                  className="min-h-11 rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={commitRename}
                  className="min-h-11 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  Rename
                </button>
              </div>
            </div>
          </AccessibleDialog>,
          document.body
        )}
    </div>
  );
}
