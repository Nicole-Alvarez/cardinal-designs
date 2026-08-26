"use client";

import {
  CARDINAL_BLOCK_MIME,
  CARDINAL_NEW_BLOCK_PAYLOAD,
} from "@/features/templates/drag-types";
import { EditorIcon } from "./editor-controls";

export default function EditorCommands({
  onAdd,
  onAddCanvas,
  onSettings,
  onMetadata,
  metadataCount,
  addingCanvas = false,
}: {
  onAdd: () => void;
  onAddCanvas: () => void;
  onSettings: () => void;
  onMetadata: () => void;
  metadataCount: number;
  addingCanvas?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={onAddCanvas}
        disabled={addingCanvas}
        className="group flex w-full items-center gap-3 rounded-xl border border-transparent p-2.5 text-left transition-colors hover:border-zinc-200 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-60 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/70"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300">
          <EditorIcon
            name={addingCanvas ? "loader-circle" : "layers-2"}
            className={addingCanvas ? "animate-spin" : ""}
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            {addingCanvas ? "Adding canvas..." : "Add canvas"}
            {!addingCanvas && <EditorIcon name="plus" className="size-3.5" />}
          </span>
          <span className="block text-[11px] leading-4 text-zinc-400 dark:text-zinc-500">
            Add front or back side
          </span>
        </span>
      </button>

      <button
        type="button"
        draggable
        onDragStart={(e) =>
          e.dataTransfer.setData(CARDINAL_BLOCK_MIME, CARDINAL_NEW_BLOCK_PAYLOAD)
        }
        onClick={onAdd}
        className="group flex w-full cursor-grab items-center gap-3 rounded-xl border border-transparent p-2.5 text-left transition-colors hover:border-zinc-200 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 active:cursor-grabbing dark:hover:border-zinc-700 dark:hover:bg-zinc-800/70"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950">
          <EditorIcon name="blocks" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            Add block
            <EditorIcon name="plus" className="size-3.5" />
          </span>
          <span className="block text-[11px] leading-4 text-zinc-400 dark:text-zinc-500">
            Click or drag to canvas
          </span>
        </span>
        <EditorIcon
          name="grip-vertical"
          className="size-4 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500 dark:text-zinc-600 dark:group-hover:text-zinc-400"
        />
      </button>

      <button
        type="button"
        onClick={onMetadata}
        className="group flex w-full items-center gap-3 rounded-xl border border-transparent p-2.5 text-left transition-colors hover:border-zinc-200 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/70"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
          <EditorIcon name="file-json" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            Metadata
            {metadataCount > 0 && (
              <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                {metadataCount}
              </span>
            )}
          </span>
          <span className="block text-[11px] leading-4 text-zinc-400 dark:text-zinc-500">
            Preview dynamic data
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={onSettings}
        className="group flex w-full items-center gap-3 rounded-xl border border-transparent p-2.5 text-left transition-colors hover:border-zinc-200 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/70"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          <EditorIcon name="settings" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            Settings
          </span>
          <span className="block text-[11px] leading-4 text-zinc-400 dark:text-zinc-500">
            Privacy, description
          </span>
        </span>
      </button>
    </div>
  );
}
