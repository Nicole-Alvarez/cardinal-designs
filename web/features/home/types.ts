export type Card = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  gradient: string;
};

export type CardFilter = {
  query: string;
  tag: string;
};

export function matchesFilter(card: Card, filter: CardFilter): boolean {
  const query = filter.query.trim().toLowerCase();
  const matchesQuery =
    query === "" ||
    card.name.toLowerCase().includes(query) ||
    card.description.toLowerCase().includes(query);
  const matchesTag = filter.tag === "" || card.tags.includes(filter.tag);
  return matchesQuery && matchesTag;
}

export function allTags(cards: Card[]): string[] {
  return [...new Set(cards.flatMap((card) => card.tags))].sort();
}