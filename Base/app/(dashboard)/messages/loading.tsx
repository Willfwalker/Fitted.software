import { Skeleton } from "@/components/ui/skeleton"

export default function MessagesLoading() {
  return (
    <div className="p-6 sm:p-8 lg:p-12 max-w-[1400px] space-y-6">
      <div>
        <Skeleton className="h-3 w-24 mb-3 bg-[var(--bg-card)]" />
        <Skeleton className="h-10 w-48 bg-[var(--bg-card)]" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-64 bg-[var(--bg-card)]" />
        <Skeleton className="h-10 w-80 bg-[var(--bg-card)]" />
        <Skeleton className="h-10 w-36 bg-[var(--bg-card)] ml-auto" />
      </div>
      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-[var(--border)]">
            <Skeleton className="h-4 w-32 bg-[var(--bg-card)]" />
            <Skeleton className="h-5 w-16 rounded-full bg-[var(--bg-card)]" />
            <Skeleton className="h-4 w-48 bg-[var(--bg-card)]" />
            <Skeleton className="h-4 w-24 bg-[var(--bg-card)] ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
