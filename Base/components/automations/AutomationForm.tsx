"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createAutomation, updateAutomation } from "@/lib/actions/automations"
import { TRIGGER_TYPES, ACTION_TYPES } from "@/lib/types/automations"
import type { Automation, TriggerType, ActionType } from "@/lib/types/automations"

interface AutomationFormProps {
  automation?: Automation
}

export function AutomationForm({ automation }: AutomationFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [triggerType, setTriggerType] = useState<TriggerType>(
    (automation?.trigger_type as TriggerType) || "DEAL_STAGE_CHANGED"
  )
  const [actionType, setActionType] = useState<ActionType>(
    (automation?.action_type as ActionType) || "CREATE_TASK"
  )

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const name = form.get("name") as string
    const description = form.get("description") as string

    // Build trigger config from form fields
    const triggerConfig: Record<string, unknown> = {}
    const triggerConfigStr = form.get("trigger_config") as string
    if (triggerConfigStr) {
      try {
        Object.assign(triggerConfig, JSON.parse(triggerConfigStr))
      } catch {
        // ignore parse errors
      }
    }

    // Build action config from form fields
    const actionConfig: Record<string, unknown> = {}
    const actionConfigStr = form.get("action_config") as string
    if (actionConfigStr) {
      try {
        Object.assign(actionConfig, JSON.parse(actionConfigStr))
      } catch {
        // ignore parse errors
      }
    }

    const data = {
      name,
      description,
      trigger_type: triggerType,
      trigger_config: triggerConfig,
      action_type: actionType,
      action_config: actionConfig,
    }

    const result = automation
      ? await updateAutomation(automation.id, data)
      : await createAutomation(data)

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      router.push("/automations")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label className="text-[var(--text-muted)] text-xs">Name</Label>
        <Input
          name="name"
          required
          defaultValue={automation?.name || ""}
          placeholder="e.g. Notify team when deal is won"
          className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
        />
      </div>

      <div>
        <Label className="text-[var(--text-muted)] text-xs">Description (optional)</Label>
        <Textarea
          name="description"
          defaultValue={automation?.description || ""}
          rows={2}
          className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-[var(--text-muted)] text-xs">Trigger</Label>
          <Select value={triggerType} onValueChange={(v) => setTriggerType(v as TriggerType)}>
            <SelectTrigger className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
              {TRIGGER_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-[var(--text)]">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[0.72rem] text-[var(--text-dim)] mt-1">
            {TRIGGER_TYPES.find((t) => t.value === triggerType)?.description}
          </p>
        </div>

        <div>
          <Label className="text-[var(--text-muted)] text-xs">Action</Label>
          <Select value={actionType} onValueChange={(v) => setActionType(v as ActionType)}>
            <SelectTrigger className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
              {ACTION_TYPES.map((a) => (
                <SelectItem key={a.value} value={a.value} className="text-[var(--text)]">
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[0.72rem] text-[var(--text-dim)] mt-1">
            {ACTION_TYPES.find((a) => a.value === actionType)?.description}
          </p>
        </div>
      </div>

      <div>
        <Label className="text-[var(--text-muted)] text-xs">Trigger Config (JSON)</Label>
        <Textarea
          name="trigger_config"
          defaultValue={automation?.trigger_config ? JSON.stringify(automation.trigger_config, null, 2) : "{}"}
          rows={3}
          placeholder='{"to_stage": "WON"}'
          className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] resize-none font-mono text-xs"
        />
      </div>

      <div>
        <Label className="text-[var(--text-muted)] text-xs">Action Config (JSON)</Label>
        <Textarea
          name="action_config"
          defaultValue={automation?.action_config ? JSON.stringify(automation.action_config, null, 2) : "{}"}
          rows={3}
          placeholder='{"title": "Follow up with {{deal_title}}", "board_id": "...", "column_id": "..."}'
          className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] resize-none font-mono text-xs"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          className="text-[var(--text-muted)]"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-[var(--accent)] text-white hover:opacity-90"
        >
          {loading ? "Saving..." : automation ? "Update" : "Create Automation"}
        </Button>
      </div>
    </form>
  )
}
