import { Skeleton } from "@/components/ui/skeleton"

export default function DealsLoading() {
  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-48 bg-[var(--bg-card)]" />
        <Skeleton className="h-10 w-28 rounded-full bg-[var(--bg-card)]" />
      </div>

      {/* Pipeline columns */}
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Skeleton className="h-2 w-2 rounded-full bg-[var(--bg)]" />
                <Skeleton className="h-4 w-20 bg-[var(--bg)]" />
              </div>
            </div>
            <div className="p-2 space-y-2">
              {Array.from({ length: 2 }).map((_, j) => (
                <Skeleton key={j} className="h-20 rounded-lg bg-[var(--bg)]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
