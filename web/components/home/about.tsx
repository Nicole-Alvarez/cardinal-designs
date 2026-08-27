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
    <section className="border-t border-border-subtle bg-surface-1">
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
          About Cardinal Designs
        </h2>
        <p className="mt-2 max-w-[70ch] text-sm leading-6 text-text-secondary">
          Cardinal Designs is a home for thoughtful card design. Whether you are marking
          a milestone or sending a quiet note, the right card starts with the right
          design — and every moment deserves one.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-10">
          {features.map((feature) => (
            <div key={feature.title}>
              <h3 className="text-base font-semibold tracking-tight text-text-primary">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
