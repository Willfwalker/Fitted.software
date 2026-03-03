"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { BlockProps, TeamListConfig } from "@/lib/blocks/types"

interface Member {
  id: string
  role: string
  email: string
}

export function TeamListBlock({ config, orgId }: BlockProps<TeamListConfig>) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      let query = supabase
        .from("organization_members")
        .select("id, user_id, role")
        .eq("org_id", orgId)

      if (config.limit) query = query.limit(config.limit)

      const { data } = await query

      // Get current user for name resolution
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const memberList = (data || []).map((m) => ({
        id: m.id,
        role: m.role,
        email: m.user_id === user?.id ? user?.email || "You" : m.user_id,
      }))

      setMembers(memberList)
      setLoading(false)
    }
    fetchData()
  }, [config, orgId])

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden h-full">
      <div className="px-7 py-5 flex items-center justify-between border-b border-[var(--border)]">
        <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
          {config.title}
        </h3>
        <span className="text-[0.7rem] text-[var(--text-dim)] font-light">
          {members.length} {members.length === 1 ? "member" : "members"}
        </span>
      </div>

      {loading ? (
        <div className="px-7 py-8 text-center text-[var(--text-dim)] text-sm">
          Loading...
        </div>
      ) : members.length === 0 ? (
        <div className="px-7 py-14 text-center">
          <p className="text-[0.82rem] text-[var(--text-dim)] font-light">
            No team members yet
          </p>
        </div>
      ) : (
        <div>
          {members.map((m, i) => (
            <div
              key={m.id}
              className="px-7 py-4 flex items-center justify-between transition-colors duration-150 hover:bg-[rgba(232,224,212,0.02)]"
              style={
                i < members.length - 1
                  ? { borderBottom: "1px solid rgba(42,37,32,0.5)" }
                  : undefined
              }
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-[0.7rem] font-medium text-[var(--text-muted)]">
                  {m.email[0].toUpperCase()}
                </div>
                <p className="text-[0.85rem] text-[var(--text)] font-light">
                  {m.email}
                </p>
              </div>
              {config.show_role && (
                <span className="text-[0.6rem] font-medium uppercase tracking-[0.14em] text-[var(--accent)] px-3 py-1 rounded-full bg-[rgba(212,115,78,0.06)]">
                  {m.role}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
