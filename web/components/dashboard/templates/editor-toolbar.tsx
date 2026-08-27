"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button, buttonClassName } from "@/components/ui/button";
import { DraftTextInput } from "./draft-inputs";
import { EditorIcon } from "./editor-controls";

type EditorMode = "wysiwyg" | "code";

interface EditorToolbarProps {
  title: string;
  description: string;
  mode: EditorMode;
  canUndo: boolean;
  canRedo: boolean;
  canSelectAll: boolean;
  allSelected: boolean;
  previewDataCount: number;
  dirty: boolean;
  saving: boolean;
  savedAt: string | null;
  canvasSelector?: ReactNode;
  onTitleCommit: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onModeChange: (mode: EditorMode) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSelectAll: () => void;
  onPreviewData: () => void;
  onSettings: () => void;
  onSave: () => void;
}

export default function EditorToolbar({
  title,
  description,
  mode,
  canUndo,
  canRedo,
  canSelectAll,
  allSelected,
  previewDataCount,
  dirty,
  saving,
  savedAt,
  canvasSelector,
  onTitleCommit,
  onDescriptionChange,
  onModeChange,
  onUndo,
  onRedo,
  onSelectAll,
  onPreviewData,
  onSettings,
  onSave,
}: EditorToolbarProps) {
  const status = saving
    ? "Saving…"
    : dirty
      ? "Unsaved changes"
      : savedAt
        ? `Saved ${savedAt}`
        : "Not saved yet";

  return (
    <header className="sticky top-0 z-40 shrink-0 overflow-visible border-b border-border-subtle bg-surface-1/95 backdrop-blur">
      <div
        role="toolbar"
        aria-label="Template editor toolbar"
        className="flex flex-wrap items-center gap-2 px-3 py-2"
      >
        <Link
          href="/dashboard/templates"
          aria-label="Back to templates"
          className={buttonClassName("ghost", "icon")}
        >
          <EditorIcon name="arrow-left" />
        </Link>

        <div className="min-w-32 flex-1 sm:max-w-sm">
          <DraftTextInput
            value={title}
            required
            onCommit={onTitleCommit}
            aria-label="Template title"
            className="block w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-text-primary outline-none hover:border-border-subtle focus-visible:border-border-strong focus-visible:ring-2 focus-visible:ring-focus"
          />
          <input
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            maxLength={500}
            aria-label="Template description"
            placeholder="Add a short description"
            className="hidden w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-xs text-text-secondary outline-none placeholder:text-text-muted hover:border-border-subtle focus-visible:border-border-strong focus-visible:ring-2 focus-visible:ring-focus lg:block"
          />
        </div>

        <div className="hidden lg:block">{canvasSelector}</div>

        <div className="hidden items-center rounded-lg border border-border-subtle bg-surface-2 p-1 lg:flex">
          {(["wysiwyg", "code"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => onModeChange(value)}
              className={`min-h-9 rounded-md px-3 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                mode === value
                  ? "bg-surface-selected text-text-primary"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {value === "wysiwyg" ? "Visual" : "Code"}
            </button>
          ))}
        </div>

        <div className="hidden items-center gap-1 lg:flex">
          <Button variant="ghost" size="compact" onClick={onUndo} disabled={!canUndo}>
            Undo
          </Button>
          <Button variant="ghost" size="compact" onClick={onRedo} disabled={!canRedo}>
            Redo
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={allSelected ? "Clear block selection" : "Select all blocks"}
            onClick={onSelectAll}
            disabled={!canSelectAll}
          >
            <EditorIcon name={allSelected ? "square-check" : "box-select"} />
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <span role="status" className="sr-only text-xs text-text-muted xl:not-sr-only">
            {status}
          </span>
          <Button className="hidden lg:inline-flex" variant="ghost" size="icon" aria-label="Preview data" onClick={onPreviewData}>
            <EditorIcon name="file-json" />
            {previewDataCount > 0 ? (
              <span className="sr-only">{previewDataCount} fields</span>
            ) : null}
          </Button>
          <Button className="lg:hidden" variant="ghost" size="icon" aria-label="More template actions" onClick={onSettings}>
            <EditorIcon name="settings" />
          </Button>
          <Button className="hidden lg:inline-flex" variant="ghost" size="icon" aria-label="Template settings" onClick={onSettings}>
            <EditorIcon name="settings" />
          </Button>
          <Button onClick={onSave} disabled={saving} aria-label="Save template" size="compact">
            <EditorIcon
              name={saving ? "loader-circle" : "save"}
              className={saving ? "size-4 animate-spin" : "size-4"}
            />
            <span className="hidden sm:inline">{saving ? "Saving…" : "Save"}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
