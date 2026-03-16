const ACTIVITY_COLORS: Record<string, string> = {
  NOTE: "#8A817A",
  EMAIL: "#5B8DEF",
  CALL: "#5EC69A",
  MEETING: "#E8A84C",
  DEAL_CREATED: "#D4734E",
  DEAL_STAGE_CHANGED: "#D4734E",
  CONTACT_CREATED: "#5EC69A",
  COMPANY_CREATED: "#5B8DEF",
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffSec = Math.floor((now - then) / 1000)

  if (diffSec < 60) return "just now"
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

interface ActivityItem {
  id: string
  type: string
  title: string
  content: string | null
  created_at: string
  contact_id: string | null
  deal_id: string | null
  company_id: string | null
}

interface ActivityFeedProps {
  activities?: ActivityItem[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const hasRealData = activities && activities.length > 0

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      <div className="px-7 py-5 border-b border-[var(--border)]">
        <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
          Recent Activity
        </h3>
      </div>
      <div className="px-7 py-3">
        {hasRealData
          ? activities.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 py-4 border-b last:border-0 border-[rgba(42,37,32,0.5)]"
              >
                <div className="relative mt-1.5 shrink-0">
                  <span
                    className="absolute inset-0 w-2 h-2 rounded-full blur-[3px] opacity-40"
                    style={{ background: ACTIVITY_COLORS[item.type] ?? "#8A817A" }}
                  />
                  <span
                    className="relative block w-2 h-2 rounded-full"
                    style={{ background: ACTIVITY_COLORS[item.type] ?? "#8A817A" }}
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
          : (
            <div className="py-10 text-center">
              <p className="text-[0.82rem] text-[var(--text-dim)] font-light">No activity yet</p>
              <p className="text-[0.72rem] text-[var(--text-dim)] font-light mt-1.5 opacity-60">
                Activity will appear here as you use the platform
              </p>
            </div>
          )}
      </div>
    </div>
  )
}
