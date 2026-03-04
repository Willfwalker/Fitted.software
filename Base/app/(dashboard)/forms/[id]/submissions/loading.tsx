import { Skeleton } from "@/components/ui/skeleton"

export default function SubmissionsLoading() {
  return (
    <div className="p-6 sm:p-8 lg:p-12 max-w-[1400px] space-y-6">
      <div>
        <Skeleton className="h-3 w-32 bg-[var(--bg-card)] mb-2" />
        <Skeleton className="h-10 w-48 bg-[var(--bg-card)]" />
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border)]">
          <Skeleton className="h-10 w-64 bg-[var(--bg-elevated)]" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-[var(--border)]">
            <Skeleton className="h-4 w-32 bg-[var(--bg-elevated)]" />
            <Skeleton className="h-4 w-48 bg-[var(--bg-elevated)]" />
            <Skeleton className="h-4 w-24 bg-[var(--bg-elevated)]" />
            <Skeleton className="h-4 w-20 bg-[var(--bg-elevated)] ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
