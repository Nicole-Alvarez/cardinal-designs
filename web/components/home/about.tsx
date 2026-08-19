export default function About() {
  const features = [
    {
      title: "Design",
      description:
        "Craft elegant, on-brand card designs with a refined palette and clean layouts.",
    },
    {
      title: "Discover",
      description:
        "Browse a curated gallery of designs and find inspiration for your next card.",
    },
    {
      title: "Search",
      description:
        "Find the perfect design fast — filter by name or by tag, from birthdays to thank-yous.",
    },
  ];

  return (
    <section className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">About Cardinal Designs</h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Cardinal Designs is a home for thoughtful card design. Whether you are marking
          a milestone or sending a quiet note, the right card starts with the right
          design — and every moment deserves one.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h3 className="text-base font-semibold tracking-tight">{feature.title}</h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}