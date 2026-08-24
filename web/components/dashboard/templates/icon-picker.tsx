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
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Icon</span>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-zinc-400 underline-offset-2 transition-colors hover:text-zinc-600 hover:underline dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            Clear
          </button>
        )}
      </div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search icons…"
        className="w-full rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700"
      />
      <div className="grid max-h-48 grid-cols-6 gap-1 overflow-y-auto rounded-lg border border-zinc-200 p-1 dark:border-zinc-800">
        {results.map((entry) => {
          const selected = entry.name === value;
          return (
            <button
              key={entry.name}
              type="button"
              title={entry.name}
              onClick={() => onChange(selected ? "" : entry.name)}
              className={
                "flex aspect-square items-center justify-center rounded-md border p-1.5 transition-colors " +
                (selected
                  ? "border-zinc-900 bg-zinc-100 text-zinc-900 dark:border-zinc-100 dark:bg-zinc-800 dark:text-zinc-50"
                  : "border-transparent text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200")
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
