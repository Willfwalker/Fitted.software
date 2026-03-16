import { DollarSign, FolderOpen, Users, Clock } from "lucide-react"

const ICONS = {
  dollar: DollarSign,
  folder: FolderOpen,
  users: Users,
  clock: Clock,
} as const

interface StatCardProps {
  title: string
  value: string
  change?: string
  subtitle?: string
  changeType?: "positive" | "negative" | "neutral"
  icon?: keyof typeof ICONS
}

export function StatCard({
  title,
  value,
  change,
  subtitle,
  changeType = "neutral",
  icon,
}: StatCardProps) {
  const Icon = icon ? ICONS[icon] : null

  return (
    <div className="group relative rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-all duration-300 hover:border-[rgba(212,115,78,0.2)] overflow-hidden">
      {/* Hover glow line */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500" />

      {/* Label with icon */}
      <div className="flex items-center gap-2.5 mb-3">
        {Icon ? (
          <div className="w-6 h-6 rounded-lg bg-[rgba(212,115,78,0.08)] flex items-center justify-center">
            <Icon className="w-3 h-3 text-[var(--accent)]" strokeWidth={2} />
          </div>
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
        )}
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
          {title}
        </p>
      </div>

      {/* Value */}
      <p className="font-[family-name:var(--font-display)] text-[1.8rem] text-[var(--text)] leading-none tracking-tight">
        {value}
      </p>

      {/* Change indicator or subtitle */}
      {(change || subtitle) && (
        <p
          className={`mt-2 text-xs font-medium ${
            changeType === "positive"
              ? "text-[#5EC69A]"
              : changeType === "negative"
                ? "text-[#5B8DEF]"
                : "text-[var(--text-dim)]"
          }`}
        >
          {change || subtitle}
        </p>
      )}
    </div>
  )
}
