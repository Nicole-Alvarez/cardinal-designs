import type { CodeLang } from "@/features/templates/types";
import { EditorIcon } from "./editor-controls";

interface TemplateEditorFooterProps {
  mode: "wysiwyg" | "code";
  lang: CodeLang;
  blockCount: number;
  metadataRecordCount: number;
  dirty: boolean;
  saving: boolean;
  savedAt: string | null;
}

function countLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export default function TemplateEditorFooter({
  mode,
  lang,
  blockCount,
  metadataRecordCount,
  dirty,
  saving,
  savedAt,
}: TemplateEditorFooterProps) {
  const saveStatus = saving
    ? { icon: "loader-circle", label: "Saving…", tone: "text-blue-600 dark:text-blue-400" }
    : dirty
      ? {
          icon: "circle-alert",
          label: "Unsaved changes",
          tone: "text-amber-700 dark:text-amber-400",
        }
      : savedAt
        ? {
            icon: "circle-check",
            label: `Last saved ${savedAt}`,
            tone: "text-emerald-700 dark:text-emerald-400",
          }
        : {
            icon: "clock",
            label: "Not saved yet",
            tone: "text-zinc-500 dark:text-zinc-400",
          };

  return (
    <footer className="sticky bottom-0 z-30 shrink-0 rounded-2xl border border-zinc-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_-18px_rgba(0,0,0,0.45)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-xs">
        <div
          aria-live="polite"
          className={`flex min-w-0 items-center gap-2 font-medium ${saveStatus.tone}`}
        >
          <EditorIcon
            name={saveStatus.icon}
            className={`size-4 shrink-0 ${saving ? "animate-spin" : ""}`}
          />
          <span className="truncate">{saveStatus.label}</span>
        </div>

        <span className="hidden h-4 w-px bg-zinc-200 dark:bg-zinc-700 sm:block" />

        <div className="flex flex-wrap items-center gap-2 text-zinc-500 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <EditorIcon name={mode === "wysiwyg" ? "layout-template" : "code-2"} className="size-3.5" />
            {mode === "wysiwyg" ? "WYSIWYG" : "Code"}
          </span>
          <span>
            {mode === "wysiwyg"
              ? countLabel(blockCount, "block")
              : lang.toUpperCase()}
          </span>
          <span aria-hidden="true">·</span>
          <span>{countLabel(metadataRecordCount, "data record")}</span>
        </div>

        <div className="ml-auto hidden min-w-0 items-center gap-2 text-zinc-400 dark:text-zinc-500 xl:flex">
          {mode === "wysiwyg" ? (
            <>
              <EditorIcon name="keyboard" className="size-4 shrink-0" />
              <Shortcut keys="⌘Z" label="Undo" />
              <Shortcut keys="⇧⌘Z" label="Redo" />
              <Shortcut keys="⌘A" label="Select all" />
              <Shortcut keys="Arrows" label="Nudge" />
              <Shortcut keys="S" label="Spacing" />
              <Shortcut keys="Delete" label="Remove" />
            </>
          ) : (
            <span>Code mode keeps WYSIWYG blocks unchanged.</span>
          )}
        </div>
      </div>
    </footer>
  );
}

function Shortcut({ keys, label }: { keys: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
        {keys}
      </kbd>
      <span>{label}</span>
    </span>
  );
}
