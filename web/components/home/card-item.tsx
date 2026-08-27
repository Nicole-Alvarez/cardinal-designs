import type { Card } from "@/features/home/types";

export default function CardItem({ card }: { card: Card }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-1">
      <div
        className={`flex aspect-[4/3] items-center justify-center bg-gradient-to-br ${card.gradient}`}
      >
        <span className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium tracking-wide text-white backdrop-blur-sm">
          {card.name}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">{card.name}</h3>
        <p className="text-sm leading-6 text-text-secondary">{card.description}</p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
          {card.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-text-secondary"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
