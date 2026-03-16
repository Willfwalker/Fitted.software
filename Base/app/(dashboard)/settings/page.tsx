import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SettingsShell } from "@/components/settings/SettingsShell"
import { getNotificationPreferences } from "@/lib/actions/notifications"
import { DEFAULT_ENABLED_MODULES, type ModuleKey } from "@/lib/config/modules"
import { hasPermission, type AppRole } from "@/lib/rbac/permissions"
import type { Tag } from "@/lib/types/crm"
import type { OrgMember } from "@/lib/types/members"

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const name =
    user.user_metadata?.full_name ?? user.user_metadata?.name ?? "User"

  // Get org for tags + modules
  const { data: membership } = await supabase
    .from("organization_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .single()

  const userRole = (membership?.role as AppRole) ?? "MEMBER"

  let tags: Tag[] = []
  let enabledModules: ModuleKey[] = DEFAULT_ENABLED_MODULES
  let inviteCodes: Array<{
    id: string; code: string; max_uses: number;
    use_count: number; expires_at: string | null; created_at: string
  }> = []
  let members: OrgMember[] = []
  const canManageInvites = hasPermission(userRole, "invite_codes:manage")
  const canToggleModules = hasPermission(userRole, "modules:toggle")

  if (membership?.org_id) {
    const { data } = await supabase
      .from("tags")
      .select("*")
      .eq("org_id", membership.org_id)
      .order("name")
    tags = (data ?? []) as Tag[]

    const { data: org } = await supabase
      .from("organizations")
      .select("enabled_modules")
      .eq("id", membership.org_id)
      .single()

    if (org?.enabled_modules && Array.isArray(org.enabled_modules)) {
      enabledModules = org.enabled_modules as ModuleKey[]
    }

    if (canManageInvites) {
      const { data: codes } = await supabase
        .from("invite_codes")
        .select("id, code, max_uses, use_count, expires_at, created_at")
        .eq("org_id", membership.org_id)
        .order("created_at", { ascending: false })
      inviteCodes = codes ?? []
    }

    // Fetch members (visible to all roles)
    const { data: memberData } = await supabase.rpc("get_org_members", {
      target_org_id: membership.org_id,
    })
    members = (memberData ?? []) as OrgMember[]
  }

  const { data: notificationPrefs } = await getNotificationPreferences()

  return (
    <SettingsShell
      user={{
        id: user.id,
        email: user.email ?? "",
        name,
        avatarUrl: user.user_metadata?.avatar_url ?? null,
      }}
      role={userRole}
      canManageInvites={canManageInvites}
      canToggleModules={canToggleModules}
      tags={tags}
      enabledModules={enabledModules}
      inviteCodes={inviteCodes}
      members={members}
      notificationPrefs={notificationPrefs}
    />
  )
}
