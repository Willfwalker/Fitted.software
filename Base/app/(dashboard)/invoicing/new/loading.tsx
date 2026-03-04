import { Skeleton } from "@/components/ui/skeleton"

export default function NewInvoiceLoading() {
  return (
    <div className="p-8 lg:p-12 max-w-[1400px] space-y-6">
      <div>
        <Skeleton className="h-3 w-20 mb-3 bg-[var(--border)]" />
        <Skeleton className="h-9 w-48 bg-[var(--border)]" />
      </div>
      <div className="max-w-[800px] space-y-6">
        <Skeleton className="h-[200px] rounded-2xl bg-[var(--border)]" />
        <Skeleton className="h-[300px] rounded-2xl bg-[var(--border)]" />
        <Skeleton className="h-[120px] rounded-2xl bg-[var(--border)]" />
      </div>
    </div>
  )
}
