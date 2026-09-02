import { canAccess, type Role } from "./roles";

export interface MenuItem {
  label: string;
  href: string;
  icon: string;
  allowedRoles: readonly Role[];
}

export const MENU_ITEMS: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "grid-3x3",
    allowedRoles: ["admin", "member"],
  },
  {
    label: "Users",
    href: "/dashboard/users",
    icon: "users",
    allowedRoles: ["admin"],
  },
  {
    label: "Templates",
    href: "/dashboard/templates",
    icon: "layout-template",
    allowedRoles: ["admin", "member"],
  },
];

export function visibleMenuItems(role: Role): MenuItem[] {
  return MENU_ITEMS.filter((item) => canAccess(role, item.allowedRoles));
}

export function activeMenuItem(items: MenuItem[], pathname: string): MenuItem | null {
  return (
    [...items]
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) ?? null
  );
}
