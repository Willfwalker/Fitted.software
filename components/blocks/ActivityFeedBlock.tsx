"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { BlockProps, ActivityFeedConfig } from "@/lib/blocks/types"

const ACTIVITY_COLORS: Record<string, string> = {
  NOTE: "#8A817A",
  EMAIL: "#5B8DEF",
  CALL: "#5EC69A",
  MEETING: "#E8A84C",
  DEAL_CREATED: "#D4734E",
  DEAL_STAGE_CHANGED: "#D4734E",
  CONTACT_CREATED: "#5EC69A",
  COMPANY_CREATED: "#5B8DEF",
  INVOICE_CREATED: "#E8A84C",
  INVOICE_SENT: "#5B8DEF",
  INVOICE_PAID: "#5EC69A",
}

function relativeTime(dateStr: string): string {
  const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diffSec < 60) return "just now"
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export function ActivityFeedBlock({
  config,
  orgId,
}: BlockProps<ActivityFeedConfig>) {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data } = await supabase
        .from("activities")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(config.limit)

      setActivities(data || [])
      setLoading(false)
    }
    fetchData()
  }, [config, orgId])

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden h-full">
      <div className="px-7 py-5 border-b border-[var(--border)]">
        <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
          {config.title}
        </h3>
      </div>
      <div className="px-7 py-3">
        {loading ? (
          <div className="py-8 text-center text-[var(--text-dim)] text-sm">
            Loading...
          </div>
        ) : activities.length === 0 ? (
          <div className="py-8 text-center text-[var(--text-dim)] text-sm font-light">
            No recent activity
          </div>
        ) : (
          activities.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 py-4 border-b last:border-0 border-[rgba(42,37,32,0.5)]"
            >
              <div className="relative mt-1.5 shrink-0">
                <span
                  className="absolute inset-0 w-2 h-2 rounded-full blur-[3px] opacity-40"
                  style={{
                    background: ACTIVITY_COLORS[item.type] ?? "#8A817A",
                  }}
                />
                <span
                  className="relative block w-2 h-2 rounded-full"
                  style={{
                    background: ACTIVITY_COLORS[item.type] ?? "#8A817A",
                  }}
                />
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-sm text-[var(--text-muted)] font-light leading-snug">
                  {item.title}
                </span>
                {item.content && (
                  <span className="text-xs text-[var(--text-dim)] font-light line-clamp-1">
                    {item.content}
                  </span>
                )}
                <span className="text-xs text-[var(--text-dim)] font-light">
                  {relativeTime(item.created_at)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
