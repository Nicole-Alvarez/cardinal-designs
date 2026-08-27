"use client";

import { useRef, useState } from "react";
import AccessibleDialog from "@/components/ui/accessible-dialog";
import { Button } from "@/components/ui/button";
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
        panelClassName="w-full max-w-lg rounded-2xl border border-border-subtle bg-surface-1 p-5 text-text-primary shadow-2xl"
      >
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="settings-dialog-title" className="text-lg font-semibold text-text-primary">
                Template settings
              </h2>
              <p id="settings-dialog-description" className="mt-1 text-xs text-text-secondary">
                Manage privacy, title, and description.
              </p>
            </div>
            <Button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Close settings"
              variant="ghost"
              size="icon"
            >
              <EditorIcon name="x" className="size-4" />
            </Button>
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
                className="mt-1 block min-h-11 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-border-strong focus:ring-2 focus:ring-focus"
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
                className="mt-1 block w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-border-strong focus:ring-2 focus:ring-focus"
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
                  className={`flex min-h-11 items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                    editIsPrivate
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border-subtle bg-surface-2 text-text-secondary hover:border-border-strong"
                  }`}
                >
                  <EditorIcon name="lock" className="size-4" />
                  Private
                </button>
                <button
                  type="button"
                  onClick={() => handlePrivacyToggle(false)}
                  aria-pressed={!editIsPrivate}
                  className={`flex min-h-11 items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                    !editIsPrivate
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border-subtle bg-surface-2 text-text-secondary hover:border-border-strong"
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
            <Button
              type="button"
              onClick={onClose}
              disabled={saving}
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save settings"}
            </Button>
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
