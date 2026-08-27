import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-border-subtle bg-app">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.06),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(197,193,182,0.04),transparent_48%)]" />
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 py-24 text-center sm:py-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-1 px-4 py-1.5 text-xs font-medium tracking-wide text-text-secondary">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
          Design elegant cards in minutes
        </span>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-balance text-text-primary sm:text-5xl">
          Beautiful card designs,
          <span className="text-text-secondary"> for every moment.</span>
        </h1>
        <p className="max-w-[65ch] text-base leading-7 text-text-secondary">
          Browse, discover, and be inspired by a growing collection of thoughtful card
          designs — birthdays, weddings, thank-yous, and everything in between.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="#discover"
            className={buttonClassName("primary", "default", "px-5")}
          >
            Browse designs
          </Link>
          <Link
            href="/login"
            className={buttonClassName("secondary", "default", "px-5")}
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
