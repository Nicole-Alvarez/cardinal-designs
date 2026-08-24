"use client";

import { useState } from "react";
import AppSidebar from "./app-sidebar";
import type { Role } from "@/lib/roles";

interface AppShellProps {
  user: { username: string; name: string | null; role: Role };
  children: React.ReactNode;
}

export default function AppShell({ user, children }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-zinc-200 dark:border-zinc-800 md:block">
        <AppSidebar user={user} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 md:hidden">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
            className="rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <span className="text-sm font-semibold tracking-tight">cardinal-designs</span>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <AppSidebar user={user} onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}
    </div>
  );
}
