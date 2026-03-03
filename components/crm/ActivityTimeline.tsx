import {
  FileText,
  Mail,
  Phone,
  Calendar,
  Plus,
  ArrowRight,
  UserPlus,
  Building2,
  Receipt,
  RefreshCw,
  Send,
  Repeat,
} from "lucide-react"
import type { Activity, ActivityType } from "@/lib/types/crm"

const iconMap: Record<ActivityType, React.ElementType> = {
  NOTE: FileText,
  EMAIL: Mail,
  CALL: Phone,
  MEETING: Calendar,
  DEAL_CREATED: Plus,
  DEAL_STAGE_CHANGED: ArrowRight,
  CONTACT_CREATED: UserPlus,
  COMPANY_CREATED: Building2,
  INVOICE_CREATED: Receipt,
  INVOICE_STATUS_CHANGED: RefreshCw,
  INVOICE_SENT: Send,
  INVOICE_RECURRING_CREATED: Repeat,
}

const colorMap: Record<ActivityType, string> = {
  NOTE: "#8A817A",
  EMAIL: "#5B8DEF",
  CALL: "#5EC69A",
  MEETING: "#E8A84C",
  DEAL_CREATED: "#D4734E",
  DEAL_STAGE_CHANGED: "#D4734E",
  CONTACT_CREATED: "#5EC69A",
  COMPANY_CREATED: "#5B8DEF",
  INVOICE_CREATED: "#D4734E",
  INVOICE_STATUS_CHANGED: "#E8A84C",
  INVOICE_SENT: "#5B8DEF",
  INVOICE_RECURRING_CREATED: "#E8A84C",
}

interface ActivityTimelineProps {
  activities: Activity[]
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <p className="text-[0.85rem] text-[var(--text-dim)] font-light py-6 text-center">
        No activity yet
      </p>
    )
  }

  return (
    <div className="space-y-0">
      {activities.map((activity, i) => {
        const Icon = iconMap[activity.type]
        const color = colorMap[activity.type]
        const isLast = i === activities.length - 1

        return (
          <div key={activity.id} className="flex gap-3">
            {/* Line + icon */}
            <div className="flex flex-col items-center">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border"
                style={{ borderColor: color, backgroundColor: `${color}10` }}
              >
                <Icon className="h-3 w-3" style={{ color }} />
              </div>
              {!isLast && (
                <div className="w-px flex-1 bg-[var(--border)]" />
              )}
            </div>

            {/* Content */}
            <div className={`pb-5 ${isLast ? "" : ""}`}>
              <p className="text-[0.85rem] text-[var(--text)] font-light leading-snug">
                {activity.title}
              </p>
              {activity.content && (
                <p className="mt-1 text-[0.82rem] text-[var(--text-muted)] font-light whitespace-pre-wrap">
                  {activity.content}
                </p>
              )}
              <p className="mt-1 text-[0.72rem] text-[var(--text-dim)]">
                {new Date(activity.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
