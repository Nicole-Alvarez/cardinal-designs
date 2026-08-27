"use client";

import { useMemo, useState } from "react";
import { ICONS, type IconEntry } from "@/features/templates/icons";

const MAX_RESULTS = 120;

function IconThumb({ entry }: { entry: IconEntry }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="100%"
      height="100%"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block" }}
      dangerouslySetInnerHTML={{ __html: entry.svg }}
    />
  );
}

export default function IconPicker({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (icon: string) => void;
}) {
  const [query, setQuery] = useState("");

  const { results, total } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q ? ICONS.filter((icon) => icon.name.includes(q)) : ICONS;
    return { results: matches.slice(0, MAX_RESULTS), total: matches.length };
  }, [query]);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label htmlFor="icon-search" className="text-xs font-medium text-text-secondary">Icon</label>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="min-h-11 rounded-md px-2 text-xs text-text-muted underline-offset-2 transition-colors hover:text-text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            Clear
          </button>
        )}
      </div>
      <input
        id="icon-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search icons…"
        className="min-h-11 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 text-base text-text-primary outline-none placeholder:text-text-muted focus:border-border-strong focus:ring-2 focus:ring-focus sm:text-sm"
      />
      <div className="grid max-h-48 grid-cols-6 gap-1 overflow-y-auto rounded-lg border border-border-subtle bg-surface-2 p-1">
        {results.map((entry) => {
          const selected = entry.name === value;
          return (
            <button
              key={entry.name}
              type="button"
              title={entry.name}
              aria-label={entry.name}
              aria-pressed={selected}
              onClick={() => onChange(selected ? "" : entry.name)}
              className={
                "flex min-h-11 min-w-11 aspect-square items-center justify-center rounded-md border p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 " +
                (selected
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-transparent text-text-muted hover:bg-surface-3 hover:text-text-primary")
              }
            >
              <span className="block h-full w-full">
                <IconThumb entry={entry} />
              </span>
            </button>
          );
        })}
      </div>
      {results.length === 0 ? (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">No matching icons.</p>
      ) : total > results.length ? (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Showing {results.length} of {total} — refine your search.
        </p>
      ) : null}
    </div>
  );
}
