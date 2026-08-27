"use client";

import { EditorIcon } from "./editor-controls";

export type MobileEditorAction = "add" | "block" | "canvas" | "preview";

const ACTIONS: ReadonlyArray<{
  id: MobileEditorAction;
  label: string;
  icon: string;
}> = [
  { id: "add", label: "Add", icon: "plus" },
  { id: "block", label: "Edit", icon: "pencil" },
  { id: "canvas", label: "Canvas", icon: "layout-template" },
  { id: "preview", label: "Preview", icon: "eye" },
];

export default function MobileEditorActions({
  active,
  onSelect,
}: {
  active: MobileEditorAction | null;
  onSelect: (action: MobileEditorAction) => void;
}) {
  return (
    <div
      role="toolbar"
      aria-label="Editor tools"
      className="sticky bottom-0 z-30 grid grid-cols-4 border-t border-border-subtle bg-surface-1 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {ACTIONS.map((action) => (
        <button
          key={action.id}
          type="button"
          aria-pressed={active === action.id}
          onClick={() => onSelect(action.id)}
          className={`flex min-h-11 flex-col items-center justify-center gap-1 px-2 py-2 text-[11px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus ${
            active === action.id
              ? "bg-accent-soft text-accent"
              : "text-text-muted hover:bg-surface-2 hover:text-text-primary"
          }`}
        >
          <EditorIcon name={action.icon} className="size-4" />
          {action.label}
        </button>
      ))}
    </div>
  );
}
