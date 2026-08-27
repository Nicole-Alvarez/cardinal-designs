import type { Card } from "@/features/home/types";
import CardItem from "./card-item";

export default function CardGrid({ cards }: { cards: Card[] }) {
  if (cards.length === 0) {
    return (
      <p className="mt-10 rounded-2xl border border-dashed border-border-strong bg-surface-1 p-10 text-center text-sm text-text-secondary">
        No designs match your search.
      </p>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <CardItem key={card.id} card={card} />
      ))}
    </div>
  );
}
