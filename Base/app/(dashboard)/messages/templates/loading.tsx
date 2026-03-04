import { Skeleton } from "@/components/ui/skeleton"

export default function TemplatesLoading() {
  return (
    <div className="p-6 sm:p-8 lg:p-12 max-w-[1400px] space-y-6">
      <div>
        <Skeleton className="h-3 w-24 mb-3 bg-[var(--bg-card)]" />
        <Skeleton className="h-10 w-48 bg-[var(--bg-card)]" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-64 bg-[var(--bg-card)]" />
        <Skeleton className="h-10 w-36 bg-[var(--bg-card)] ml-auto" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-3">
            <Skeleton className="h-5 w-32 bg-[var(--bg-elevated)]" />
            <Skeleton className="h-4 w-48 bg-[var(--bg-elevated)]" />
            <Skeleton className="h-16 w-full bg-[var(--bg-elevated)]" />
          </div>
        ))}
      </div>
    </div>
  )
}
