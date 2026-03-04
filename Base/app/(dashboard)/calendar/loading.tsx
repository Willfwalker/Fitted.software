import { Skeleton } from "@/components/ui/skeleton"

export default function CalendarLoading() {
  return (
    <div className="p-6 sm:p-8 lg:p-12 max-w-[1400px] space-y-6">
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

      {/* Calendar grid */}
      <Skeleton className="h-[600px] rounded-xl bg-[var(--bg-card)]" />
    </div>
  )
}
