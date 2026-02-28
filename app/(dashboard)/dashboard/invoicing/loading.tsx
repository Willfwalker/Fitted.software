import { Skeleton } from "@/components/ui/skeleton"

export default function InvoicingLoading() {
  return (
    <div className="p-8 lg:p-12 max-w-[1400px] space-y-6">
      <div>
        <Skeleton className="h-3 w-20 mb-3 bg-[var(--border)]" />
        <Skeleton className="h-9 w-48 bg-[var(--border)]" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 flex-1 max-w-sm bg-[var(--border)]" />
        <Skeleton className="h-10 w-[280px] bg-[var(--border)]" />
        <Skeleton className="h-10 w-[140px] bg-[var(--border)]" />
      </div>
      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-[var(--border)]">
            <Skeleton className="h-4 w-20 bg-[var(--border)]" />
            <Skeleton className="h-5 w-16 bg-[var(--border)]" />
            <Skeleton className="h-4 w-32 bg-[var(--border)]" />
            <Skeleton className="h-4 w-20 bg-[var(--border)]" />
            <Skeleton className="h-4 w-24 bg-[var(--border)]" />
          </div>
        ))}
      </div>
    </div>
  )
}
