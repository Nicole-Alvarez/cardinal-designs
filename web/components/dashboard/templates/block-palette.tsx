"use client";

const DRAG_MIME = "application/x-cardinal-block";

export default function BlockPalette({
  onAdd,
  onMetadata,
  metadataCount,
}: {
  onAdd: () => void;
  onMetadata: () => void;
  metadataCount: number;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Blocks
      </p>
      <button
        type="button"
        draggable
        onDragStart={(e) => e.dataTransfer.setData(DRAG_MIME, "new")}
        onClick={onAdd}
        className="w-full cursor-grab rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-3 text-left text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-50 active:cursor-grabbing dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        + Add block
      </button>
      <button
        type="button"
        onClick={onMetadata}
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        Metadata{metadataCount > 0 ? ` (${metadataCount})` : ""}
      </button>
      <p className="pt-1 text-xs text-zinc-400 dark:text-zinc-500">
        Click to add, or drag onto the canvas. Switch its variant and style in the
        inspector.
      </p>
    </div>
  );
}
