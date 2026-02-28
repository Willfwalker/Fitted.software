import { Skeleton } from "@/components/ui/skeleton"

export default function RecurringLoading() {
  return (
    <div className="p-8 lg:p-12 max-w-[1200px] space-y-6">
      <div>
        <Skeleton className="h-4 w-32 mb-3 bg-[var(--border)]" />
        <Skeleton className="h-9 w-64 bg-[var(--border)]" />
        <Skeleton className="h-4 w-80 mt-2 bg-[var(--border)]" />
      </div>
      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-[var(--border)]">
            <Skeleton className="h-4 w-24 bg-[var(--border)]" />
            <Skeleton className="h-4 w-20 bg-[var(--border)]" />
            <Skeleton className="h-4 w-16 bg-[var(--border)]" />
            <Skeleton className="h-4 w-20 bg-[var(--border)]" />
            <Skeleton className="h-5 w-16 bg-[var(--border)]" />
          </div>
        ))}
      </div>
    </div>
  )
}
