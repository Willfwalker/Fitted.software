import { Skeleton } from "@/components/ui/skeleton"

export default function ContactsLoading() {
  return (
    <div className="space-y-6">
      {/* Toolbar skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-80 bg-[var(--bg-card)]" />
        <Skeleton className="h-10 w-32 rounded-full bg-[var(--bg-card)]" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border)]">
          <div className="grid grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 bg-[var(--bg-card)]" />
            ))}
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 border-b border-[var(--border)] last:border-0">
            <div className="grid grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} className="h-4 bg-[var(--bg-card)]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
