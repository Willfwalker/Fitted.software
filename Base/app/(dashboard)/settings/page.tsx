import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SignOutButton } from "@/components/dashboard/SignOutButton"
import { TagManager } from "@/components/tags/TagManager"
import { ModuleToggle } from "@/components/settings/ModuleToggle"
import { DEFAULT_ENABLED_MODULES, type ModuleKey } from "@/lib/config/modules"
import type { Tag } from "@/lib/types/crm"

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

  let tags: Tag[] = []
  let enabledModules: ModuleKey[] = DEFAULT_ENABLED_MODULES

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
  }

  return (
    <div className="p-8 lg:p-12 max-w-[600px] space-y-8">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] divide-y divide-[var(--border)]">
        {/* Profile info */}
        <div className="px-7 py-5 flex items-center justify-between">
          <div>
            <p className="text-[0.84rem] text-[var(--text)] font-light">{name}</p>
            <p className="text-[0.72rem] text-[var(--text-dim)] font-light mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* Sign out */}
        <div className="px-7 py-5">
          <SignOutButton />
        </div>
      </div>

      {/* Modules */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-7">
        <ModuleToggle enabledModules={enabledModules} />
      </div>

      {/* Tags */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-7">
        <TagManager tags={tags} />
      </div>
    </div>
  )
}
