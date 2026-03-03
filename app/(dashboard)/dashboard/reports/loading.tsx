import { Skeleton } from "@/components/ui/skeleton"

export default function ReportsLoading() {
  return (
    <div className="p-8 lg:p-12 max-w-[1400px] space-y-6">
      <div>
        <Skeleton className="h-3 w-20 mb-3 bg-[var(--border)]" />
        <Skeleton className="h-9 w-32 bg-[var(--border)]" />
        <Skeleton className="h-4 w-56 mt-2 bg-[var(--border)]" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[320px] rounded-2xl bg-[var(--border)]" />
        ))}
      </div>
    </div>
  )
}
