import type { CardFilter } from "@/features/home/types";

export default function SearchBar({
  filter,
  onFilterChange,
  tags,
}: {
  filter: CardFilter;
  onFilterChange: (filter: CardFilter) => void;
  tags: string[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h2 className="text-2xl font-semibold tracking-tight">Discover designs</h2>
        <input
          type="search"
          value={filter.query}
          onChange={(e) => onFilterChange({ ...filter, query: e.target.value })}
          placeholder="Search by name or description…"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 sm:w-72"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const active = filter.tag === tag;
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onFilterChange({ ...filter, tag: active ? "" : tag })}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                  : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}