import { Skeleton } from "@/components/ui/skeleton"

export default function FormEditorLoading() {
  return (
    <div className="p-6 sm:p-8 lg:p-12 max-w-[1400px] space-y-6">
      <div>
        <Skeleton className="h-3 w-24 bg-[var(--bg-card)] mb-2" />
        <Skeleton className="h-10 w-64 bg-[var(--bg-card)]" />
      </div>

      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-32 bg-[var(--bg-card)] rounded-full" />
        <Skeleton className="h-10 w-32 bg-[var(--bg-card)] rounded-full" />
        <Skeleton className="h-10 w-32 bg-[var(--bg-card)] rounded-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 bg-[var(--bg-card)] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 bg-[var(--bg-card)] rounded-xl" />
      </div>
    </div>
  )
}
