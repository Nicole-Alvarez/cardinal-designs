export type Role = "admin" | "member";

export const ROLES: readonly Role[] = ["admin", "member"];

export const DEFAULT_ROLE: Role = "member";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  member: "Member",
};

export function toRole(value: unknown): Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value)
    ? (value as Role)
    : DEFAULT_ROLE;
}

export function canAccess(role: Role, allowedRoles: readonly Role[]): boolean {
  return allowedRoles.includes(role);
}
