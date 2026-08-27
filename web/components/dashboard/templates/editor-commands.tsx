"use client";

import {
  blockDragPayload,
  CARDINAL_BLOCK_MIME,
} from "@/features/templates/drag-types";
import type { AddableBlockType } from "@/features/templates/types";
import { EditorIcon } from "./editor-controls";

const BLOCK_OPTIONS: ReadonlyArray<{
  type: AddableBlockType;
  label: string;
  icon: string;
}> = [
  { type: "heading", label: "Heading", icon: "file-code" },
  { type: "text", label: "Text", icon: "pencil" },
  { type: "button", label: "Button", icon: "rectangle-horizontal" },
  { type: "image", label: "Image", icon: "image-down" },
  { type: "icon", label: "Icon", icon: "sparkles" },
  { type: "qr", label: "QR code", icon: "grid-3x3" },
  { type: "barcode", label: "Barcode", icon: "code-2" },
];

export default function EditorCommands({
  onAdd,
}: {
  onAdd: (type: AddableBlockType) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2" aria-label="Block types">
      {BLOCK_OPTIONS.map(({ type, label, icon }) => (
        <button
          key={type}
          type="button"
          draggable
          aria-label={`Add ${label === "QR code" ? label : label.toLowerCase()}`}
          onDragStart={(event) =>
            event.dataTransfer.setData(
              CARDINAL_BLOCK_MIME,
              blockDragPayload(type)
            )
          }
          onClick={() => onAdd(type)}
          className="group flex min-h-16 cursor-grab flex-col items-start justify-between rounded-lg border border-border-subtle bg-surface-2 p-3 text-left text-text-secondary outline-none transition-colors hover:border-border-strong hover:bg-surface-3 hover:text-text-primary focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1 active:cursor-grabbing"
        >
          <EditorIcon name={icon} className="size-4 text-accent" />
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}
