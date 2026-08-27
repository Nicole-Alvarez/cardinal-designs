"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/logout-button";
import { buttonClassName } from "@/components/ui/button";
import { EditorIcon } from "@/components/dashboard/templates/editor-controls";
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
    <div className="flex h-full flex-col bg-surface-1">
      <div className="flex min-h-16 items-center justify-between gap-3 px-5 py-3">
        <p id={titleId} className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
          {onClose ? "Main navigation" : "cardinal-designs"}
        </p>
        {onClose && (
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className={buttonClassName("ghost", "icon")}
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

      <nav aria-label="Primary" className="flex-1 space-y-1 overflow-y-auto px-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active?.href === item.href ? "page" : undefined}
            className={
              active?.href === item.href
                ? "flex min-h-11 items-center gap-3 rounded-lg bg-accent-soft px-3 py-2 text-sm font-medium text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                : "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            }
          >
            <EditorIcon
              name={item.icon}
              className={`size-4 shrink-0 ${
                active?.href === item.href ? "text-accent" : "text-text-muted"
              }`}
            />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="space-y-3 border-t border-border-subtle px-4 py-4">
        <div>
          <p className="text-sm font-medium text-text-primary">{user.name ?? user.username}</p>
          <p className="text-xs text-text-muted">{ROLE_LABELS[user.role]}</p>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}
