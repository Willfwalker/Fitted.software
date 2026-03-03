import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Sparkles, ChevronRight } from "lucide-react"
import { SignOutButton } from "@/components/dashboard/SignOutButton"
import { TagManager } from "@/components/tags/TagManager"
import type { Tag } from "@/lib/types/crm"

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const name =
    user.user_metadata?.full_name ?? user.user_metadata?.name ?? "User"

  // Get org for tags
  const { data: membership } = await supabase
    .from("organization_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .single()

  const isAdmin = membership?.role === "OWNER" || membership?.role === "ADMIN"

  let tags: Tag[] = []
  if (membership?.org_id) {
    const { data } = await supabase
      .from("tags")
      .select("*")
      .eq("org_id", membership.org_id)
      .order("name")
    tags = (data ?? []) as Tag[]
  }

  return (
    <div className="p-8 lg:p-12 max-w-[600px] space-y-8">
      <div>
        <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-[var(--accent)] mb-2 block">
          Settings
        </span>
        <h1 className="font-[family-name:var(--font-display)] text-[2.2rem] text-[var(--text)] tracking-tight leading-tight">
          Account
        </h1>
      </div>

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

      {/* Custom Fields (OWNER/ADMIN only) */}
      {isAdmin && (
        <Link
          href="/dashboard/settings/custom-fields"
          className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-7 py-5 flex items-center justify-between hover:bg-[rgba(232,224,212,0.02)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            <div>
              <p className="text-[0.88rem] text-[var(--text)] font-light">Custom Fields</p>
              <p className="text-[0.75rem] text-[var(--text-dim)] font-light mt-0.5">
                Add custom fields to contacts, companies, and deals using AI
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-[var(--text-dim)]" />
        </Link>
      )}

      {/* Tags */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-7">
        <TagManager tags={tags} />
      </div>
    </div>
  )
}
