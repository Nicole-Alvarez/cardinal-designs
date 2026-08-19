import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          © {new Date().getFullYear()} Cardinal Designs
        </p>
        <nav className="flex gap-6 text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="#discover" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100">
            Designs
          </Link>
          <Link href="/login" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100">
            Sign in
          </Link>
          <Link href="/dashboard" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100">
            Dashboard
          </Link>
        </nav>
      </div>
    </footer>
  );
}