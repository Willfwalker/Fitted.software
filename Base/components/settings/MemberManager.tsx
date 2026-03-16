"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Shield, ShieldAlert, User, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { hasPermission, type AppRole } from "@/lib/rbac/permissions"
import { updateMemberRole, removeMember } from "@/lib/actions/members"
import type { OrgMember } from "@/lib/types/members"

interface MemberManagerProps {
  members: OrgMember[]
  currentUserRole: AppRole
  currentUserId: string
}

const ROLE_CONFIG: Record<AppRole, { label: string; icon: typeof Shield; color: string }> = {
  OWNER: { label: "Owner", icon: ShieldAlert, color: "text-[var(--accent)]" },
  ADMIN: { label: "Admin", icon: Shield, color: "text-yellow-500" },
  MEMBER: { label: "Member", icon: User, color: "text-[var(--text-dim)]" },
}

export function MemberManager({ members, currentUserRole, currentUserId }: MemberManagerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const canManage = hasPermission(currentUserRole, "members:manage")

  const handleRoleChange = async (memberId: string, newRole: AppRole) => {
    setLoading(memberId)
    setError(null)
    const result = await updateMemberRole(memberId, newRole)
    if (result.error) setError(result.error)
    else router.refresh()
    setLoading(null)
  }

  const handleRemove = async (memberId: string) => {
    setLoading(memberId)
    setError(null)
    const result = await removeMember(memberId)
    if (result.error) setError(result.error)
    else router.refresh()
    setLoading(null)
  }

  return (
    <div>
      <h3 className="text-[0.88rem] text-[var(--text)] font-light mb-4">Members</h3>
      {error && (
        <p className="text-[0.78rem] text-red-400 mb-3">{error}</p>
      )}
      <div className="space-y-2">
        {members.map((member) => {
          const config = ROLE_CONFIG[member.role]
          const Icon = config.icon
          const isCurrentUser = member.user_id === currentUserId
          const isOwner = member.role === "OWNER"
          const showActions = canManage && !isOwner && !isCurrentUser

          return (
            <div
              key={member.member_id}
              className="flex items-center justify-between py-2.5 px-1"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[rgba(232,224,212,0.05)] text-[0.72rem] font-light text-[var(--text-muted)]">
                    {(member.full_name || member.email || "?")
                      .split(" ")
                      .map((w: string) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-[0.84rem] text-[var(--text)] font-light truncate">
                    {member.full_name || member.email}
                    {isCurrentUser && (
                      <span className="text-[var(--text-dim)] ml-1.5">(you)</span>
                    )}
                  </p>
                  <p className="text-[0.72rem] text-[var(--text-dim)] font-light truncate">
                    {member.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[0.72rem] font-light ${config.color}`}>
                  {config.label}
                </span>
                {showActions && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-[var(--text-dim)] hover:text-[var(--text)]"
                        disabled={loading === member.member_id}
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[var(--bg-card)] border-[var(--border)]">
                      {member.role !== "ADMIN" && (
                        <DropdownMenuItem
                          onClick={() => handleRoleChange(member.member_id, "ADMIN")}
                          className="text-[var(--text-muted)] focus:text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]"
                        >
                          <Shield className="h-3.5 w-3.5 mr-2" />
                          Make Admin
                        </DropdownMenuItem>
                      )}
                      {member.role !== "MEMBER" && (
                        <DropdownMenuItem
                          onClick={() => handleRoleChange(member.member_id, "MEMBER")}
                          className="text-[var(--text-muted)] focus:text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]"
                        >
                          <User className="h-3.5 w-3.5 mr-2" />
                          Make Member
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleRemove(member.member_id)}
                        className="text-red-400 focus:text-red-300 focus:bg-[rgba(232,224,212,0.05)]"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
