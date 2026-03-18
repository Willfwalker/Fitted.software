"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Pencil, Trash2, ArrowLeft } from "lucide-react"
import { DeleteConfirmDialog } from "@/components/crm/DeleteConfirmDialog"
import { toggleAutomation, deleteAutomation } from "@/lib/actions/automations"
import { TRIGGER_TYPES, ACTION_TYPES } from "@/lib/types/automations"
import type { Automation, AutomationLog } from "@/lib/types/automations"
import { AutomationForm } from "./AutomationForm"

interface AutomationDetailProps {
  automation: Automation
  logs: AutomationLog[]
}

export function AutomationDetail({ automation, logs }: AutomationDetailProps) {
  const router = useRouter()
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const trigger = TRIGGER_TYPES.find((t) => t.value === automation.trigger_type)
  const action = ACTION_TYPES.find((a) => a.value === automation.action_type)

  const handleToggle = async (enabled: boolean) => {
    await toggleAutomation(automation.id, enabled)
    router.refresh()
  }

  const handleDelete = async () => {
    await deleteAutomation(automation.id)
    router.push("/automations")
  }

  if (showEdit) {
    return (
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowEdit(false)}
          className="gap-1.5 text-[var(--text-muted)] mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Button>
        <h1 className="font-[family-name:var(--font-display)] text-[1.3rem] text-[var(--text)] mb-6">
          Edit Automation
        </h1>
        <AutomationForm automation={automation} />
      </div>
    )
  }

  return (
    <div>
      <Link
        href="/automations"
        className="inline-flex items-center gap-1.5 text-[0.8rem] text-[var(--text-muted)] hover:text-[var(--text)] mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Automations
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-[1.3rem] text-[var(--text)]">
            {automation.name}
          </h1>
          {automation.description && (
            <p className="text-[0.85rem] text-[var(--text-muted)] mt-1">
              {automation.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={automation.enabled} onCheckedChange={handleToggle} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowEdit(true)}
            className="h-8 w-8 text-[var(--text-dim)] hover:text-[var(--text)]"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDelete(true)}
            className="h-8 w-8 text-[var(--text-dim)] hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Trigger/Action summary */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl border border-[var(--border)] p-4">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)] mb-2">
            Trigger
          </p>
          <p className="text-[0.9rem] text-[var(--text)] font-medium">{trigger?.label}</p>
          <p className="text-[0.78rem] text-[var(--text-muted)]">{trigger?.description}</p>
          {Object.keys(automation.trigger_config).length > 0 && (
            <pre className="mt-2 text-[0.72rem] text-[var(--text-dim)] bg-[var(--bg)] rounded p-2 overflow-auto">
              {JSON.stringify(automation.trigger_config, null, 2)}
            </pre>
          )}
        </div>
        <div className="rounded-xl border border-[var(--border)] p-4">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)] mb-2">
            Action
          </p>
          <p className="text-[0.9rem] text-[var(--text)] font-medium">{action?.label}</p>
          <p className="text-[0.78rem] text-[var(--text-muted)]">{action?.description}</p>
          {Object.keys(automation.action_config).length > 0 && (
            <pre className="mt-2 text-[0.72rem] text-[var(--text-dim)] bg-[var(--bg)] rounded p-2 overflow-auto">
              {JSON.stringify(automation.action_config, null, 2)}
            </pre>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-6 text-[0.8rem] text-[var(--text-muted)]">
        <span>Run {automation.run_count} time{automation.run_count !== 1 ? "s" : ""}</span>
        {automation.last_run_at && (
          <span>Last run: {new Date(automation.last_run_at).toLocaleString()}</span>
        )}
      </div>

      {/* Run Logs */}
      <div>
        <h2 className="text-[0.85rem] font-medium text-[var(--text)] mb-3">Run History</h2>
        {logs.length === 0 ? (
          <p className="text-[0.8rem] text-[var(--text-dim)] italic">No runs yet.</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border)] p-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Badge
                    variant="outline"
                    className="text-[0.65rem] px-1.5 py-0 border-0 font-medium shrink-0"
                    style={{
                      color: log.status === "SUCCESS" ? "#5EC69A" : "#EF5B5B",
                      backgroundColor: log.status === "SUCCESS" ? "#5EC69A15" : "#EF5B5B15",
                    }}
                  >
                    {log.status}
                  </Badge>
                  {log.error_message && (
                    <span className="text-[0.75rem] text-red-400 truncate">
                      {log.error_message}
                    </span>
                  )}
                </div>
                <span className="text-[0.72rem] text-[var(--text-dim)] shrink-0">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <DeleteConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        onConfirm={handleDelete}
        title="Delete Automation"
        description={`Are you sure you want to delete "${automation.name}"? This cannot be undone.`}
      />
    </div>
  )
}
