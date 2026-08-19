import type { Card } from "@/features/home/types";

export default function CardItem({ card }: { card: Card }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div
        className={`flex aspect-[4/3] items-center justify-center bg-gradient-to-br ${card.gradient}`}
      >
        <span className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium tracking-wide text-white backdrop-blur-sm">
          {card.name}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-base font-semibold tracking-tight">{card.name}</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{card.description}</p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
          {card.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}