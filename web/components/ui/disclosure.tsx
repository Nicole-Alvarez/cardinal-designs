"use client";

import { useId, useState } from "react";

export default function Disclosure({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <section className="border-b border-border-subtle last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-11 w-full items-center justify-between gap-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary outline-none transition-colors hover:text-text-primary focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1"
      >
        {title}
        <span aria-hidden="true" className="text-base leading-none text-text-muted">
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? (
        <div id={contentId} className="space-y-3 pb-4">
          {children}
        </div>
      ) : null}
    </section>
  );
}
