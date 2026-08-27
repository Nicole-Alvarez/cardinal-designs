"use client";

import { useState } from "react";
import AppSidebar from "./app-sidebar";
import type { Role } from "@/lib/roles";
import AccessibleDialog from "@/components/ui/accessible-dialog";

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
            className="grid size-11 place-items-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:text-zinc-400 dark:hover:bg-zinc-800"
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

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>

      <AccessibleDialog
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        labelledBy="mobile-navigation-title"
        overlayClassName="items-stretch justify-start p-0 md:hidden"
        panelClassName="h-full w-72 max-w-[88vw] bg-white shadow-2xl dark:bg-zinc-900"
      >
        <aside className="h-full">
          <AppSidebar
            user={user}
            onNavigate={() => setMenuOpen(false)}
            onClose={() => setMenuOpen(false)}
            titleId="mobile-navigation-title"
          />
        </aside>
      </AccessibleDialog>
    </div>
  );
}
