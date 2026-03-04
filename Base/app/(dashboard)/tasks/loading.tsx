import { Skeleton } from "@/components/ui/skeleton"

export default function TasksLoading() {
  return (
    <div className="p-8 lg:p-12 max-w-[1400px] space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-3 w-16 bg-[var(--bg-card)] mb-3" />
        <Skeleton className="h-9 w-40 bg-[var(--bg-card)]" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24 bg-[var(--bg-card)]" />
        <Skeleton className="h-10 w-32 rounded-full bg-[var(--bg-card)]" />
      </div>

      {/* Board grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl bg-[var(--bg-card)]" />
        ))}
      </div>
    </div>
  )
}
