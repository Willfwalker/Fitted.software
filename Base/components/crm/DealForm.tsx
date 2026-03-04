"use client"

import { useActionState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createDeal, updateDeal, type DealActionState } from "@/lib/actions/deals"
import type { Deal } from "@/lib/types/crm"
import { DEAL_STAGES } from "@/lib/types/crm"

interface DealFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contacts: { id: string; first_name: string; last_name: string }[]
  companies: { id: string; name: string }[]
  deal?: Deal
}

export function DealForm({ open, onOpenChange, contacts, companies, deal }: DealFormProps) {
  const isEdit = !!deal

  const action = isEdit
    ? updateDeal.bind(null, deal.id)
    : createDeal

  const [state, formAction, isPending] = useActionState<DealActionState, FormData>(action, {})

  useEffect(() => {
    if (state.success) {
      onOpenChange(false)
    }
  }, [state.success, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-display)] text-[1.3rem] text-[var(--text)]">
            {isEdit ? "Edit Deal" : "Add Deal"}
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Deal Title *</Label>
            <Input
              name="title"
              defaultValue={deal?.title ?? ""}
              required
              className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[0.78rem] text-[var(--text-muted)]">Value ($)</Label>
              <Input
                name="value"
                type="number"
                min="0"
                step="0.01"
                defaultValue={deal?.value ?? ""}
                className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[0.78rem] text-[var(--text-muted)]">Stage *</Label>
              <Select name="stage" defaultValue={deal?.stage ?? "LEAD"}>
                <SelectTrigger className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                  {DEAL_STAGES.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[0.78rem] text-[var(--text-muted)]">Priority</Label>
              <Select name="priority" defaultValue={deal?.priority ?? "MEDIUM"}>
                <SelectTrigger className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                  <SelectItem value="LOW" className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">Low</SelectItem>
                  <SelectItem value="MEDIUM" className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">Medium</SelectItem>
                  <SelectItem value="HIGH" className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[0.78rem] text-[var(--text-muted)]">Expected Close</Label>
              <Input
                name="expected_close_date"
                type="date"
                defaultValue={deal?.expected_close_date ?? ""}
                className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Contact</Label>
            <Select name="contact_id" defaultValue={deal?.contact_id ?? ""}>
              <SelectTrigger className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]">
                <SelectValue placeholder="Select a contact" />
              </SelectTrigger>
              <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">
                    {c.first_name} {c.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Company</Label>
            <Select name="company_id" defaultValue={deal?.company_id ?? ""}>
              <SelectTrigger className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]">
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Notes</Label>
            <Textarea
              name="notes"
              defaultValue={deal?.notes ?? ""}
              rows={3}
              className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] resize-none"
            />
          </div>

          {state.error && (
            <p className="text-[0.82rem] text-red-400">{state.error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-6"
            >
              {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Deal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
