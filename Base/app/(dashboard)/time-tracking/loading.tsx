import { Skeleton } from "@/components/ui/skeleton"

export default function TimeTrackingLoading() {
  return (
    <div className="p-8 lg:p-12 max-w-[1400px] space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-3 w-24 mb-3 bg-[var(--border)]" />
          <Skeleton className="h-9 w-40 bg-[var(--border)]" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 bg-[var(--border)]" />
          <Skeleton className="h-9 w-24 bg-[var(--border)]" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-xl bg-[var(--border)]" />
        <Skeleton className="h-24 rounded-xl bg-[var(--border)]" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 flex-1 max-w-sm bg-[var(--border)]" />
        <Skeleton className="h-8 w-64 bg-[var(--border)]" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg bg-[var(--border)]" />
        ))}
      </div>
    </div>
  )
}
