"use client";

import { useRef } from "react";
import AccessibleDialog from "@/components/ui/accessible-dialog";
import { Button } from "@/components/ui/button";
import { EditorIcon } from "./editor-controls";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  confirmVariant = "default",
  onConfirm,
  onCancel,
  loading = false,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <AccessibleDialog
      open={open}
      onClose={onCancel}
      labelledBy="confirm-dialog-title"
      describedBy="confirm-dialog-description"
      initialFocusRef={cancelRef}
      closeOnBackdrop={!loading}
      panelClassName="w-full max-w-md rounded-2xl border border-border-subtle bg-surface-1 p-5 text-text-primary shadow-2xl"
    >
        <div className="flex items-start gap-3">
          <span
            className={`grid size-9 shrink-0 place-items-center rounded-lg ${
              confirmVariant === "danger"
                ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            <EditorIcon
              name={confirmVariant === "danger" ? "circle-alert" : "circle-help"}
              className="size-4"
            />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="confirm-dialog-title"
              className="text-base font-semibold text-text-primary"
            >
              {title}
            </h2>
            <p id="confirm-dialog-description" className="mt-1 text-sm text-text-secondary">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={loading}
            variant="ghost"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            variant={confirmVariant === "danger" ? "destructive" : "primary"}
          >
            {loading ? "Processing..." : confirmLabel}
          </Button>
        </div>
    </AccessibleDialog>
  );
}
