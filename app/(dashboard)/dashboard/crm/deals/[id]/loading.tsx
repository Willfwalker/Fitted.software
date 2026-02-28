import { Skeleton } from "@/components/ui/skeleton"

export default function DealDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-32 bg-[var(--border)]" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-7 space-y-5">
            <Skeleton className="h-8 w-2/3 bg-[var(--border)]" />
            <div className="flex gap-3">
              <Skeleton className="h-6 w-20 rounded-full bg-[var(--border)]" />
              <Skeleton className="h-6 w-16 rounded-full bg-[var(--border)]" />
            </div>
            <Skeleton className="h-10 w-40 bg-[var(--border)]" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-16 bg-[var(--border)]" />
              <Skeleton className="h-16 bg-[var(--border)]" />
              <Skeleton className="h-16 bg-[var(--border)]" />
              <Skeleton className="h-16 bg-[var(--border)]" />
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-4">
            <Skeleton className="h-4 w-20 bg-[var(--border)]" />
            <Skeleton className="h-24 w-full bg-[var(--border)]" />
            <Skeleton className="h-12 w-full bg-[var(--border)]" />
            <Skeleton className="h-12 w-full bg-[var(--border)]" />
          </div>
        </div>
      </div>
    </div>
  )
}
