import { Skeleton } from "@/components/ui/skeleton"

export default function BoardLoading() {
  return (
    <div className="p-8 lg:p-12 max-w-[1600px] space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-5 rounded bg-[var(--bg-card)]" />
        <div>
          <Skeleton className="h-7 w-48 bg-[var(--bg-card)]" />
          <Skeleton className="h-3 w-32 bg-[var(--bg-card)] mt-2" />
        </div>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Skeleton className="h-2 w-2 rounded-full bg-[var(--bg)]" />
                <Skeleton className="h-4 w-20 bg-[var(--bg)]" />
              </div>
            </div>
            <div className="p-2 space-y-2 min-h-[200px]">
              {Array.from({ length: 2 }).map((_, j) => (
                <Skeleton key={j} className="h-24 rounded-lg bg-[var(--bg)]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
