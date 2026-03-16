export type AppRole = "OWNER" | "ADMIN" | "MEMBER"

export type Permission =
  | "records:delete"
  | "features:request"
  | "invite_codes:manage"
  | "members:view"
  | "members:manage"
  | "modules:toggle"
  | "org:settings"

const ROLE_HIERARCHY: Record<AppRole, number> = {
  MEMBER: 0,
  ADMIN: 1,
  OWNER: 2,
}

const ROLE_PERMISSIONS: Record<AppRole, Set<Permission>> = {
  MEMBER: new Set(["members:view"]),
  ADMIN: new Set([
    "records:delete",
    "features:request",
    "invite_codes:manage",
    "members:view",
    "members:manage",
  ]),
  OWNER: new Set([
    "records:delete",
    "features:request",
    "invite_codes:manage",
    "members:view",
    "members:manage",
    "modules:toggle",
    "org:settings",
  ]),
}

export function hasPermission(role: AppRole | undefined | null, permission: Permission): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false
}

export function isAtLeast(role: AppRole | undefined | null, minimum: AppRole): boolean {
  if (!role) return false
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimum]
}
