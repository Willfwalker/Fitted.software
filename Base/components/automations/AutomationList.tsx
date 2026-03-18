"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Zap } from "lucide-react"
import { toggleAutomation } from "@/lib/actions/automations"
import { TRIGGER_TYPES, ACTION_TYPES } from "@/lib/types/automations"
import type { Automation } from "@/lib/types/automations"

interface AutomationListProps {
  automations: Automation[]
}

export function AutomationList({ automations }: AutomationListProps) {
  const router = useRouter()

  const handleToggle = async (id: string, enabled: boolean) => {
    await toggleAutomation(id, enabled)
    router.refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-[1.5rem] text-[var(--text)]">
            Automations
          </h1>
          <p className="text-[0.85rem] text-[var(--text-muted)]">
            Automate workflows with triggers and actions
          </p>
        </div>
        <Button asChild className="bg-[var(--accent)] text-white hover:opacity-90 gap-1.5">
          <Link href="/automations/new">
            <Plus className="h-4 w-4" />
            New Automation
          </Link>
        </Button>
      </div>

      {automations.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-xl">
          <Zap className="h-8 w-8 text-[var(--text-dim)] mx-auto mb-3" />
          <p className="text-[0.9rem] text-[var(--text-muted)] mb-1">No automations yet</p>
          <p className="text-[0.8rem] text-[var(--text-dim)]">
            Create your first automation to streamline your workflow.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {automations.map((auto) => {
            const trigger = TRIGGER_TYPES.find((t) => t.value === auto.trigger_type)
            const action = ACTION_TYPES.find((a) => a.value === auto.action_type)

            return (
              <Link
                key={auto.id}
                href={`/automations/${auto.id}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] p-4 hover:border-[var(--accent)] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-3.5 w-3.5 text-[var(--accent)]" />
                    <span className="text-[0.9rem] font-medium text-[var(--text)]">
                      {auto.name}
                    </span>
                    {!auto.enabled && (
                      <Badge
                        variant="outline"
                        className="text-[0.65rem] px-1.5 py-0 border-0 font-medium"
                        style={{ color: "#8A817A", backgroundColor: "#8A817A15" }}
                      >
                        Disabled
                      </Badge>
                    )}
                  </div>
                  <p className="text-[0.78rem] text-[var(--text-muted)]">
                    When <span className="text-[var(--text)]">{trigger?.label || auto.trigger_type}</span>
                    {" → "}
                    <span className="text-[var(--text)]">{action?.label || auto.action_type}</span>
                  </p>
                  {auto.run_count > 0 && (
                    <p className="text-[0.72rem] text-[var(--text-dim)] mt-0.5">
                      Run {auto.run_count} time{auto.run_count !== 1 ? "s" : ""}
                      {auto.last_run_at && ` · Last: ${new Date(auto.last_run_at).toLocaleDateString()}`}
                    </p>
                  )}
                </div>
                <div onClick={(e) => e.preventDefault()}>
                  <Switch
                    checked={auto.enabled}
                    onCheckedChange={(checked) => handleToggle(auto.id, checked)}
                  />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
