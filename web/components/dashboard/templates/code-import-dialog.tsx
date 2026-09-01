"use client";

import { useRef, useState } from "react";
import { handleTabKeyboardNavigation } from "@/components/ui/tab-keyboard";
import AccessibleDialog from "@/components/ui/accessible-dialog";
import { EditorIcon, EditorTooltip } from "./editor-controls";

const SOURCE_TYPES: { value: "html" | "react"; label: string; icon: string }[] = [
  { value: "html", label: "HTML", icon: "code-xml" },
  { value: "react", label: "React", icon: "atom" },
];

const ACCEPT = ".html,.htm,.tsx,.jsx,.xml,.txt";

export default function CodeImportDialog({
  open,
  onClose,
  onImport,
  initialType = "html",
}: {
  open: boolean;
  onClose: () => void;
  onImport: (lang: "html" | "react", source: string) => void;
  initialType?: "html" | "react";
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [sourceType, setSourceType] = useState<"html" | "react">(initialType);
  const [source, setSource] = useState("");
  const [confirming, setConfirming] = useState(false);

  function closeDialog() {
    setConfirming(false);
    onClose();
  }

  function confirmImport() {
    if (!source.trim()) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    onImport(sourceType, source);
    setSource("");
    closeDialog();
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const detected: "html" | "react" = /\.(tsx|jsx)$/i.test(file.name)
      ? "react"
      : "html";
    setSourceType(detected);
    const text = await file.text();
    setSource(text);
  }

  return (
    <AccessibleDialog
      open={open}
      onClose={onClose}
      labelledBy="code-import-title"
      describedBy={confirming ? "code-import-disclaimer" : "code-import-description"}
      initialFocusRef={confirming ? confirmRef : cancelRef}
      panelClassName="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
    >
      <div className="flex items-start justify-between gap-3 border-b border-zinc-200 p-5 dark:border-zinc-800">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            <EditorIcon name="arrow-up-right" />
          </span>
          <div>
            <h2
              id="code-import-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              {confirming ? `Import ${sourceType === "react" ? "React" : "HTML"}?` : "Import code"}
            </h2>
            <p
              id="code-import-description"
              className="mt-1 text-xs text-zinc-500 dark:text-zinc-400"
            >
              Paste or upload generated HTML or React code into the editor.
            </p>
          </div>
        </div>
        <EditorTooltip label="Close" align="right">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close import dialog"
            className="grid size-8 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            <EditorIcon name="x" />
          </button>
        </EditorTooltip>
      </div>

      {confirming ? (
        <div className="p-5">
          <div
            id="code-import-disclaimer"
            className="flex items-start gap-2.5 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200"
          >
            <EditorIcon name="circle-alert" className="mt-1 size-4 shrink-0" />
            <p>
              Import is best-effort. Layout, fonts, spacing, effects, and unsupported custom
              code may differ from the original preview. You can review and edit the imported
              code before converting to Visual.
            </p>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              ref={cancelRef}
              type="button"
              onClick={closeDialog}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              ref={confirmRef}
              type="button"
              onClick={confirmImport}
              className="flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-900"
            >
              <EditorIcon name="arrow-up-right" />
              Continue import
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4 p-5">
        <div
          role="radiogroup"
          aria-label="Code source type"
          className="flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800/80"
        >
          {SOURCE_TYPES.map((type, index) => (
            <button
              key={type.value}
              type="button"
              role="radio"
              aria-checked={sourceType === type.value}
              onClick={() => setSourceType(type.value)}
              onKeyDown={(event) =>
                handleTabKeyboardNavigation(event, index, SOURCE_TYPES.length, (nextIndex) =>
                  setSourceType(SOURCE_TYPES[nextIndex].value)
                )
              }
              className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
                sourceType === type.value
                  ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-700 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              <EditorIcon name={type.icon} className="size-4" />
              {type.label}
            </button>
          ))}
        </div>

        <textarea
          value={source}
          onChange={(event) => setSource(event.target.value)}
          rows={10}
          spellCheck={false}
          aria-label={`${sourceType === "react" ? "React" : "HTML"} code to import`}
          placeholder={
            sourceType === "react"
              ? "export default function Card() {\n  return (...);\n}"
              : "<div>…</div>"
          }
          className="min-h-40 w-full resize-y rounded-xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-xs leading-6 text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:placeholder:text-zinc-600"
        />

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <EditorIcon name="inbox" className="size-4" />
            {sourceType === "react" ? "Upload .tsx / .jsx" : "Upload .html"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            aria-label="Upload code file"
            className="hidden"
            onChange={(event) => void handleFile(event)}
          />
          <span className="text-xs text-zinc-400 dark:text-zinc-500">or paste above</span>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-zinc-200 p-5 dark:border-zinc-800">
        <button
          ref={cancelRef}
          type="button"
          onClick={closeDialog}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={confirmImport}
          disabled={!source.trim()}
          className="flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          <EditorIcon name="arrow-up-right" />
          Import
        </button>
          </div>
        </>
      )}
    </AccessibleDialog>
  );
}
