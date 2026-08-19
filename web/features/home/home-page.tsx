"use client";

import { useState } from "react";
import Hero from "@/components/home/hero";
import SearchBar from "@/components/home/search-bar";
import CardGrid from "@/components/home/card-grid";
import About from "@/components/home/about";
import Footer from "@/components/home/footer";
import { sampleCards } from "./data";
import { allTags, matchesFilter, type CardFilter } from "./types";

export default function HomePage({
  initialQuery,
  initialTag,
}: {
  initialQuery: string;
  initialTag: string;
}) {
  const [filter, setFilter] = useState<CardFilter>({
    query: initialQuery,
    tag: initialTag,
  });

  const visibleCards = sampleCards.filter((card) => matchesFilter(card, filter));
  const tags = allTags(sampleCards);

  return (
    <>
      <Hero />
      <section id="discover" className="mx-auto w-full max-w-6xl scroll-mt-8 px-6 py-16">
        <SearchBar filter={filter} onFilterChange={setFilter} tags={tags} />
        <CardGrid cards={visibleCards} />
      </section>
      <About />
      <Footer />
    </>
  );
}