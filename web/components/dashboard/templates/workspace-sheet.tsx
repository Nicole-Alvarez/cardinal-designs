"use client";

import { useId } from "react";
import AccessibleDialog from "@/components/ui/accessible-dialog";
import { Button } from "@/components/ui/button";
import { EditorIcon } from "./editor-controls";

export default function WorkspaceSheet({
  open,
  title,
  placement,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  placement: "right" | "bottom";
  onClose: () => void;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const bottom = placement === "bottom";

  return (
    <AccessibleDialog
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      overlayClassName={bottom ? "items-end justify-stretch p-0 md:items-stretch md:justify-end" : "items-stretch justify-end p-0"}
      panelClassName={
        bottom
          ? "flex max-h-[min(78dvh,42rem)] w-full flex-col rounded-t-2xl border-t border-border-subtle bg-surface-1 pb-[env(safe-area-inset-bottom)] shadow-2xl md:h-full md:max-h-none md:max-w-sm md:rounded-none md:border-l md:border-t-0 md:pb-0"
          : "flex h-full w-full max-w-sm flex-col border-l border-border-subtle bg-surface-1 shadow-2xl"
      }
    >
      <div className="order-2 min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      <div className="order-1 flex min-h-14 items-center justify-between gap-3 border-b border-border-subtle px-4">
        <h2 id={titleId} className="text-sm font-semibold text-text-primary">
          {title}
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label={`Close ${title}`}>
          <EditorIcon name="x" />
        </Button>
      </div>
    </AccessibleDialog>
  );
}
