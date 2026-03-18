import { notFound } from "next/navigation"
import { getAutomation, getAutomationLogs } from "@/lib/actions/automations"
import { AutomationDetail } from "@/components/automations/AutomationDetail"

export default async function AutomationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [{ data: automation }, { data: logs }] = await Promise.all([
    getAutomation(id),
    getAutomationLogs(id),
  ])

  if (!automation) return notFound()

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <AutomationDetail automation={automation} logs={logs} />
    </div>
  )
}
