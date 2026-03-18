"use client"

import { useState } from "react"
import { User, Bell, Users, Blocks, LogOut } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { SignOutButton } from "@/components/dashboard/SignOutButton"
import { NotificationPreferences } from "@/components/settings/NotificationPreferences"
import { MemberManager } from "@/components/settings/MemberManager"
import { InviteCodeManager } from "@/components/settings/InviteCodeManager"
import { ModuleToggle } from "@/components/settings/ModuleToggle"
import { TagManager } from "@/components/tags/TagManager"
import { ProfileEditor } from "@/components/settings/ProfileEditor"
import type { AppRole } from "@/lib/rbac/permissions"
import type { ModuleKey } from "@/lib/config/modules"
import type { Tag } from "@/lib/types/crm"
import type { OrgMember } from "@/lib/types/members"
import type { NotificationPreference } from "@/lib/types/notifications"
import type { Profile } from "@/lib/types/profile"

interface SettingsShellProps {
  user: {
    id: string
    email: string
    name: string
    avatarUrl?: string | null
  }
  role: AppRole
  canManageInvites: boolean
  canToggleModules: boolean
  tags: Tag[]
  enabledModules: ModuleKey[]
  inviteCodes: Array<{
    id: string; code: string; max_uses: number;
    use_count: number; expires_at: string | null; created_at: string
  }>
  members: OrgMember[]
  notificationPrefs: NotificationPreference[]
  profile: Profile | null
}

const ROLE_BADGE: Record<AppRole, { label: string; bg: string; text: string }> = {
  OWNER: { label: "Owner", bg: "bg-[rgba(212,115,78,0.12)]", text: "text-[var(--accent)]" },
  ADMIN: { label: "Admin", bg: "bg-[rgba(234,179,8,0.1)]", text: "text-yellow-500" },
  MEMBER: { label: "Member", bg: "bg-[rgba(232,224,212,0.06)]", text: "text-[var(--text-muted)]" },
}

const TABS = [
  { value: "account", label: "Account", icon: User },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "team", label: "Team", icon: Users },
  { value: "workspace", label: "Workspace", icon: Blocks },
] as const

function getInitials(name: string, email: string): string {
  if (name && name !== "User") {
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
  }
  return email[0]?.toUpperCase() ?? "?"
}

export function SettingsShell({
  user,
  role,
  canManageInvites,
  canToggleModules,
  tags,
  enabledModules,
  inviteCodes,
  members,
  notificationPrefs,
  profile,
}: SettingsShellProps) {
  const [activeTab, setActiveTab] = useState("account")
  const badge = ROLE_BADGE[role]

  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-[960px]">
      {/* Profile Header */}
      <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 md:p-7 mb-8 overflow-hidden">
        {/* Warm glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 80% at 20% 50%, rgba(212,115,78,0.06) 0%, transparent 70%)",
          }}
        />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 ring-1 ring-[var(--border)]">
              {user.avatarUrl && (
                <AvatarImage src={user.avatarUrl} alt={user.name} />
              )}
              <AvatarFallback className="bg-[rgba(212,115,78,0.1)] text-[var(--accent)] text-lg font-light">
                {getInitials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1
                  className="text-[1.25rem] text-[var(--text)] font-normal truncate"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {user.name}
                </h1>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.65rem] font-medium tracking-wide uppercase ${badge.bg} ${badge.text}`}>
                  {badge.label}
                </span>
              </div>
              <p className="text-[0.78rem] text-[var(--text-dim)] font-light mt-0.5 truncate">
                {user.email}
              </p>
            </div>
          </div>
          <div className="hidden sm:block shrink-0">
            <SignOutButton />
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        orientation="vertical"
        className="flex flex-col md:flex-row gap-0 md:gap-8"
      >
        {/* Desktop: Vertical sidebar tabs */}
        <TabsList
          variant="line"
          className="hidden md:flex w-[180px] shrink-0 flex-col items-stretch gap-0.5 bg-transparent p-0"
        >
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="justify-start gap-2.5 rounded-lg px-3.5 py-2.5 text-[0.84rem] font-light border-0 text-[var(--text-muted)] transition-all duration-200 after:hidden data-[state=active]:bg-[rgba(212,115,78,0.06)] data-[state=active]:text-[var(--text)] data-[state=active]:shadow-none data-[state=active]:border-l-2 data-[state=active]:border-l-[var(--accent)] data-[state=active]:rounded-l-none hover:bg-[rgba(232,224,212,0.03)] hover:text-[var(--text)]"
            >
              <tab.icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Mobile: Horizontal icon-only tabs */}
        <TabsList
          variant="line"
          className="flex md:hidden w-full justify-start gap-1 bg-transparent p-0 mb-6 border-b border-[var(--border)] pb-2"
        >
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              title={tab.label}
              className="flex-none rounded-lg px-3 py-2 text-[var(--text-muted)] border-0 after:hidden data-[state=active]:bg-[rgba(212,115,78,0.06)] data-[state=active]:text-[var(--text)] data-[state=active]:shadow-none hover:bg-[rgba(232,224,212,0.03)]"
            >
              <tab.icon className="h-4 w-4" strokeWidth={1.8} />
              <span className="text-[0.78rem] font-light ml-1.5">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          {/* Account */}
          <TabsContent value="account" className="animate-settings-tab-enter">
            <div className="space-y-6">
              {/* Profile Editor */}
              <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-elevated)] p-6">
                <h3 className="text-[0.82rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)] mb-5">
                  Profile
                </h3>
                <ProfileEditor user={user} profile={profile} />
              </div>

              {/* Danger Zone */}
              <div className="rounded-xl border border-[rgba(239,91,91,0.15)] bg-[var(--bg-elevated)] p-6">
                <h3 className="text-[0.82rem] font-medium uppercase tracking-[0.14em] text-red-400 mb-4">
                  Danger Zone
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[0.84rem] text-[var(--text)] font-light">Sign out</p>
                    <p className="text-[0.72rem] text-[var(--text-dim)] font-light mt-0.5">
                      End your current session
                    </p>
                  </div>
                  <SignOutButton />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="animate-settings-tab-enter">
            <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-elevated)] p-6">
              <NotificationPreferences preferences={notificationPrefs} />
            </div>
          </TabsContent>

          {/* Team */}
          <TabsContent value="team" className="animate-settings-tab-enter">
            <div className="space-y-6">
              <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-elevated)] p-6">
                <MemberManager
                  members={members}
                  currentUserRole={role}
                  currentUserId={user.id}
                />
              </div>

              {canManageInvites && (
                <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-elevated)] p-6">
                  <InviteCodeManager inviteCodes={inviteCodes} />
                </div>
              )}
            </div>
          </TabsContent>

          {/* Workspace */}
          <TabsContent value="workspace" className="animate-settings-tab-enter">
            <div className="space-y-6">
              {canToggleModules && (
                <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-elevated)] p-6">
                  <ModuleToggle enabledModules={enabledModules} />
                </div>
              )}

              <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-elevated)] p-6">
                <TagManager tags={tags} />
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
