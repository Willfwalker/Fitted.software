import { Skeleton } from "@/components/ui/skeleton"

export default function FormsLoading() {
  return (
    <div className="p-6 sm:p-8 lg:p-12 max-w-[1400px] space-y-6">
      <div>
        <Skeleton className="h-3 w-24 bg-[var(--bg-card)] mb-2" />
        <Skeleton className="h-10 w-48 bg-[var(--bg-card)]" />
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64 bg-[var(--bg-card)]" />
        <Skeleton className="h-10 w-32 bg-[var(--bg-card)] rounded-full" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 bg-[var(--bg-card)] rounded-xl" />
        ))}
      </div>
    </div>
  )
}
