import type { AppRole } from "@/lib/rbac/permissions"

export interface OrgMember {
  member_id: string
  user_id: string
  email: string
  full_name: string
  role: AppRole
  joined_at: string
}
