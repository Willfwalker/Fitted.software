import { Badge } from "@/components/ui/badge"
import { INVOICE_STATUSES, type InvoiceStatus } from "@/lib/types/crm"

interface StatusBadgeProps {
  status: InvoiceStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = INVOICE_STATUSES.find((s) => s.value === status)
  if (!config) return null

  return (
    <Badge
      variant="outline"
      className="text-[0.72rem] px-2.5 py-0.5 border-0 font-medium"
      style={{ color: config.color, backgroundColor: `${config.color}15` }}
    >
      {config.label}
    </Badge>
  )
}
