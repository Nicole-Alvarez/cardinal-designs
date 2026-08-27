"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/logout-button";
import { ROLE_LABELS, type Role } from "@/lib/roles";
import { activeMenuItem, visibleMenuItems } from "@/lib/sidebar-menu";

interface AppSidebarProps {
  user: { username: string; name: string | null; role: Role };
  onNavigate?: () => void;
  onClose?: () => void;
  titleId?: string;
}

export default function AppSidebar({ user, onNavigate, onClose, titleId }: AppSidebarProps) {
  const pathname = usePathname();
  const items = visibleMenuItems(user.role);
  const active = activeMenuItem(items, pathname);

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-16 items-center justify-between gap-3 px-5 py-3">
        <p id={titleId} className="text-sm font-semibold tracking-tight">
          {onClose ? "Main navigation" : "cardinal-designs"}
        </p>
        {onClose && (
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="grid size-11 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <svg
              aria-hidden="true"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active?.href === item.href ? "page" : undefined}
            className={
              active?.href === item.href
                ? "flex min-h-11 items-center rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:bg-zinc-800 dark:text-zinc-50"
                : "flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="space-y-2 border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
        <div>
          <p className="text-sm font-medium">{user.name ?? user.username}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {ROLE_LABELS[user.role]}
          </p>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}
