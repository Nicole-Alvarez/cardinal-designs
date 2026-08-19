import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-zinc-200 dark:border-zinc-800">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(236,72,153,0.10),transparent_55%)]" />
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 py-24 text-center">
        <span className="rounded-full border border-zinc-200 bg-white/70 px-4 py-1.5 text-xs font-medium tracking-wide text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-300">
          Design elegant cards in minutes
        </span>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Beautiful card designs,
          <span className="text-zinc-500 dark:text-zinc-400"> for every moment.</span>
        </h1>
        <p className="max-w-xl text-base text-zinc-600 dark:text-zinc-400">
          Browse, discover, and be inspired by a growing collection of thoughtful card
          designs — birthdays, weddings, thank-yous, and everything in between.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="#discover"
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Browse designs
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}