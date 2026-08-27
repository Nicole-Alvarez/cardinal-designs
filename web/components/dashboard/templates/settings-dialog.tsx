"use client";

import { useRef, useState } from "react";
import AccessibleDialog from "@/components/ui/accessible-dialog";
import { EditorIcon } from "./editor-controls";
import { DraftTextInput } from "./draft-inputs";
import ConfirmDialog from "./confirm-dialog";

function SettingsDialogContent({
  title,
  description,
  isPrivate,
  onClose,
  onSave,
}: {
  title: string;
  description: string;
  isPrivate: boolean;
  onClose: () => void;
  onSave: (patch: { title: string; description: string; isPrivate: boolean }) => void | Promise<void>;
}) {
  const [editTitle, setEditTitle] = useState(title);
  const [editDescription, setEditDescription] = useState(description);
  const [editIsPrivate, setEditIsPrivate] = useState(isPrivate);
  const [privacyConfirmOpen, setPrivacyConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  function handlePrivacyToggle(nextValue: boolean) {
    if (!nextValue && editIsPrivate) {
      setPrivacyConfirmOpen(true);
      return;
    }
    setEditIsPrivate(nextValue);
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      await onSave({
        title: editTitle,
        description: editDescription,
        isPrivate: editIsPrivate,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AccessibleDialog
        open
        onClose={onClose}
        labelledBy="settings-dialog-title"
        describedBy="settings-dialog-description"
        initialFocusRef={closeButtonRef}
        closeOnBackdrop={!saving}
        panelClassName="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl dark:bg-zinc-900"
      >
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="settings-dialog-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Template settings
              </h2>
              <p id="settings-dialog-description" className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Manage privacy, title, and description.
              </p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Close settings"
              className="grid size-11 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              <EditorIcon name="x" className="size-4" />
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Title
              </label>
              <DraftTextInput
                value={editTitle}
                required
                onCommit={setEditTitle}
                aria-label="Template title"
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Description
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                maxLength={500}
                rows={3}
                aria-label="Template description"
                placeholder="Add a short description"
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Visibility
              </label>
              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => handlePrivacyToggle(true)}
                  aria-pressed={editIsPrivate}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
                    editIsPrivate
                      ? "border-zinc-950 bg-zinc-950 text-white shadow-sm dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600"
                  }`}
                >
                  <EditorIcon name="lock" className="size-4" />
                  Private
                </button>
                <button
                  type="button"
                  onClick={() => handlePrivacyToggle(false)}
                  aria-pressed={!editIsPrivate}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
                    !editIsPrivate
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-sm dark:border-emerald-500 dark:bg-emerald-500"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600"
                  }`}
                >
                  <EditorIcon name="globe" className="size-4" />
                  Anyone with link
                </button>
              </div>
              <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                {editIsPrivate
                  ? "Only you can see this template."
                  : "Anyone with the link can view this template."}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="min-h-11 rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="min-h-11 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-900"
            >
              {saving ? "Saving…" : "Save settings"}
            </button>
          </div>
        </div>
      </AccessibleDialog>

      <ConfirmDialog
        open={privacyConfirmOpen}
        title="Allow access by link?"
        description="Anyone with the link will be able to view this template. You can switch back to private at any time."
        confirmLabel="Allow link access"
        onConfirm={() => {
          setEditIsPrivate(false);
          setPrivacyConfirmOpen(false);
        }}
        onCancel={() => setPrivacyConfirmOpen(false)}
      />
    </>
  );
}

export default function SettingsDialog({
  open,
  title,
  description,
  isPrivate,
  onClose,
  onSave,
}: {
  open: boolean;
  title: string;
  description: string;
  isPrivate: boolean;
  onClose: () => void;
  onSave: (patch: { title: string; description: string; isPrivate: boolean }) => void | Promise<void>;
}) {
  if (!open) return null;

  return (
    <SettingsDialogContent
      key={`${title}|${description}|${isPrivate}`}
      title={title}
      description={description}
      isPrivate={isPrivate}
      onClose={onClose}
      onSave={onSave}
    />
  );
}
