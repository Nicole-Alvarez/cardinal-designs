"use client";

import { Button } from "@/components/ui/button";
import { EditorIcon } from "./editor-controls";

export default function OutputDrawer({
  open,
  onOpenChange,
  title,
  className = "",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`overflow-hidden rounded-xl border border-border-subtle bg-surface-1 ${className}`}>
      <div className="flex min-h-12 items-center justify-between gap-3 px-3">
        <div className="flex min-w-0 items-center gap-2">
          <EditorIcon name="file-code" className="size-4 text-accent" />
          <span className="truncate text-sm font-semibold text-text-primary">{title}</span>
        </div>
        <Button
          variant="ghost"
          size="compact"
          aria-expanded={open}
          onClick={() => onOpenChange(!open)}
          aria-label={open ? "Close preview and export" : "Open preview and export"}
        >
          {open ? "Close" : "Open"}
          <EditorIcon name="chevron-down" className={`size-4 ${open ? "rotate-180" : ""}`} />
        </Button>
      </div>
      {open ? (
        <div role="region" aria-label={title} className="border-t border-border-subtle">
          {children}
        </div>
      ) : null}
    </section>
  );
}
