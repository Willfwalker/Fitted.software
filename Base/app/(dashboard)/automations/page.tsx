import { getAutomations } from "@/lib/actions/automations"
import { AutomationList } from "@/components/automations/AutomationList"

export default async function AutomationsPage() {
  const { data: automations } = await getAutomations()

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <AutomationList automations={automations} />
    </div>
  )
}
