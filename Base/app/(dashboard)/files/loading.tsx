import { Skeleton } from "@/components/ui/skeleton"

export default function FilesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-80 bg-[var(--bg-card)]" />
        <Skeleton className="h-10 w-36 bg-[var(--bg-card)]" />
        <Skeleton className="h-10 w-36 rounded-full bg-[var(--bg-card)]" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--border)] p-4 space-y-3"
          >
            <Skeleton className="h-10 w-10 rounded-lg bg-[var(--bg-card)]" />
            <Skeleton className="h-4 w-3/4 bg-[var(--bg-card)]" />
            <Skeleton className="h-3 w-1/2 bg-[var(--bg-card)]" />
          </div>
        ))}
      </div>
    </div>
  )
}
