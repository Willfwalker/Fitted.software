import { AutomationPrompt } from "@/components/automations/AutomationPrompt"
import { Zap } from "lucide-react"

export default function NewAutomationPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2.5 mb-1">
        <Zap className="h-5 w-5 text-[var(--accent)]" />
        <h1 className="font-[family-name:var(--font-display)] text-[1.5rem] text-[var(--text)]">
          Create Automation
        </h1>
      </div>
      <p className="text-[0.85rem] text-[var(--text-muted)] mb-8">
        Describe what you want to automate in plain English.
      </p>
      <AutomationPrompt />
    </div>
  )
}
