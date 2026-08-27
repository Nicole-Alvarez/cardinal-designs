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
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
          Discover designs
        </h2>
        <input
          type="search"
          aria-label="Search designs"
          value={filter.query}
          onChange={(e) => onFilterChange({ ...filter, query: e.target.value })}
          placeholder="Search by name or description…"
          className="min-h-11 w-full rounded-lg border border-border-strong bg-surface-1 px-3 text-base text-text-primary outline-none placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-app sm:w-72 sm:text-sm"
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
              aria-pressed={active}
              className={`min-h-11 rounded-full border px-4 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-app ${
                active
                  ? "border-accent bg-accent-soft text-text-primary"
                  : "border-border-subtle bg-surface-1 text-text-secondary hover:border-border-strong hover:bg-surface-2 hover:text-text-primary"
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
