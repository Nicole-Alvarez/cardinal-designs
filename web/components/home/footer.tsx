import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-app">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <p className="text-sm text-text-muted">
          © {new Date().getFullYear()} Cardinal Designs
        </p>
        <nav aria-label="Footer" className="flex gap-6 text-sm text-text-secondary">
          <Link
            href="#discover"
            className="rounded-sm underline-offset-4 transition-colors hover:text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            Designs
          </Link>
          <Link
            href="/login"
            className="rounded-sm underline-offset-4 transition-colors hover:text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="rounded-sm underline-offset-4 transition-colors hover:text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </footer>
  );
}
