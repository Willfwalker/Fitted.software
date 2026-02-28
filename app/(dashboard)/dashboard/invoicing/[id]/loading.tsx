import { Skeleton } from "@/components/ui/skeleton"

export default function InvoiceDetailLoading() {
  return (
    <div className="p-8 lg:p-12 max-w-[900px] space-y-6">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-20 bg-[var(--border)]" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32 bg-[var(--border)]" />
          <Skeleton className="h-9 w-9 bg-[var(--border)]" />
        </div>
      </div>
      <Skeleton className="h-[500px] rounded-2xl bg-[var(--border)]" />
    </div>
  )
}
