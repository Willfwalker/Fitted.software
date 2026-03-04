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
import { Checkbox } from "@/components/ui/checkbox"
import {
  createEvent,
  updateEvent,
  type EventActionState,
} from "@/lib/actions/events"
import { EVENT_STATUSES, EVENT_COLORS } from "@/lib/types/scheduling"
import type { CalendarEvent } from "@/lib/types/scheduling"

interface EventFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contacts: { id: string; first_name: string; last_name: string }[]
  companies: { id: string; name: string }[]
  deals: { id: string; title: string }[]
  members: { id: string; email: string; name: string }[]
  event?: CalendarEvent
  defaults?: { start_at?: string; end_at?: string; all_day?: boolean }
}

function toLocalDatetime(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

export function EventForm({
  open,
  onOpenChange,
  contacts,
  companies,
  deals,
  members,
  event,
  defaults,
}: EventFormProps) {
  const isEdit = !!event
  const action = isEdit ? updateEvent.bind(null, event.id) : createEvent
  const [state, formAction, isPending] = useActionState<
    EventActionState,
    FormData
  >(action, {})

  useEffect(() => {
    if (state.success) onOpenChange(false)
  }, [state.success, onOpenChange])

  const defaultStart =
    toLocalDatetime(event?.start_at) ||
    toLocalDatetime(defaults?.start_at) ||
    ""
  const defaultEnd =
    toLocalDatetime(event?.end_at) || toLocalDatetime(defaults?.end_at) || ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] sm:max-w-[560px] p-0 gap-0 overflow-hidden max-h-[90vh]">
        {/* Accent bar */}
        <div className="h-1 w-full bg-[var(--accent)]" />

        <DialogHeader className="px-7 pt-6 pb-0">
          <DialogTitle className="font-[family-name:var(--font-display)] text-[1.4rem] text-[var(--text)] tracking-tight">
            {isEdit ? "Edit Event" : "New Event"}
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="px-7 pb-7 pt-5 space-y-5 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Title */}
          <div className="space-y-2">
            <Label className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-[var(--text-dim)]">
              Title
            </Label>
            <Input
              name="title"
              defaultValue={event?.title ?? ""}
              placeholder="Meeting with client"
              className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-dim)] h-10"
              required
            />
          </div>

          {/* Start / End */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-[var(--text-dim)]">
                Start
              </Label>
              <Input
                name="start_at"
                type="datetime-local"
                defaultValue={defaultStart}
                className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] h-10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-[var(--text-dim)]">
                End
              </Label>
              <Input
                name="end_at"
                type="datetime-local"
                defaultValue={defaultEnd}
                className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] h-10"
              />
            </div>
          </div>

          {/* All Day */}
          <div className="flex items-center gap-2.5">
            <Checkbox
              name="all_day"
              value="true"
              defaultChecked={event?.all_day ?? defaults?.all_day ?? false}
              className="border-[var(--border)] cursor-pointer"
            />
            <Label className="text-[0.8rem] text-[var(--text-muted)] cursor-pointer">
              All day event
            </Label>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-[var(--text-dim)]">
              Location
            </Label>
            <Input
              name="location"
              defaultValue={event?.location ?? ""}
              placeholder="Office, Zoom link, etc."
              className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-dim)] h-10"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-[var(--text-dim)]">
              Description
            </Label>
            <Textarea
              name="description"
              defaultValue={event?.description ?? ""}
              placeholder="Event details..."
              rows={3}
              className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-dim)] resize-none"
            />
          </div>

          {/* Divider */}
          <div className="h-px bg-[var(--border)]" />

          {/* Status + Color row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-[var(--text-dim)]">
                Status
              </Label>
              <Select
                name="status"
                defaultValue={event?.status ?? "SCHEDULED"}
              >
                <SelectTrigger className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] h-10 cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                  {EVENT_STATUSES.map((s) => (
                    <SelectItem
                      key={s.value}
                      value={s.value}
                      className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)] cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        {s.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-[var(--text-dim)]">
                Color
              </Label>
              <Select name="color" defaultValue={event?.color || "__none__"}>
                <SelectTrigger className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] h-10 cursor-pointer">
                  <SelectValue placeholder="Default" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                  <SelectItem
                    value="__none__"
                    className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)] cursor-pointer"
                  >
                    Default
                  </SelectItem>
                  {EVENT_COLORS.map((c) => (
                    <SelectItem
                      key={c.value}
                      value={c.value}
                      className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)] cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: c.value }}
                        />
                        {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <Label className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-[var(--text-dim)]">
              Assigned To
            </Label>
            <Select
              name="assigned_to"
              defaultValue={event?.assigned_to || "__none__"}
            >
              <SelectTrigger className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] h-10 cursor-pointer">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                <SelectItem
                  value="__none__"
                  className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)] cursor-pointer"
                >
                  Unassigned
                </SelectItem>
                {members.map((m) => (
                  <SelectItem
                    key={m.id}
                    value={m.id}
                    className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)] cursor-pointer"
                  >
                    {m.name || m.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Divider */}
          <div className="h-px bg-[var(--border)]" />

          {/* CRM Links */}
          <div>
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)] mb-3">
              Link to CRM
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-[0.75rem] text-[var(--text-muted)]">
                  Contact
                </Label>
                <Select
                  name="contact_id"
                  defaultValue={event?.contact_id || "__none__"}
                >
                  <SelectTrigger className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.82rem] h-10 cursor-pointer">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                    <SelectItem
                      value="__none__"
                      className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)] cursor-pointer"
                    >
                      None
                    </SelectItem>
                    {contacts.map((c) => (
                      <SelectItem
                        key={c.id}
                        value={c.id}
                        className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)] cursor-pointer"
                      >
                        {c.first_name} {c.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[0.75rem] text-[var(--text-muted)]">
                  Company
                </Label>
                <Select
                  name="company_id"
                  defaultValue={event?.company_id || "__none__"}
                >
                  <SelectTrigger className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.82rem] h-10 cursor-pointer">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                    <SelectItem
                      value="__none__"
                      className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)] cursor-pointer"
                    >
                      None
                    </SelectItem>
                    {companies.map((c) => (
                      <SelectItem
                        key={c.id}
                        value={c.id}
                        className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)] cursor-pointer"
                      >
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[0.75rem] text-[var(--text-muted)]">
                  Deal
                </Label>
                <Select name="deal_id" defaultValue={event?.deal_id || "__none__"}>
                  <SelectTrigger className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.82rem] h-10 cursor-pointer">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                    <SelectItem
                      value="__none__"
                      className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)] cursor-pointer"
                    >
                      None
                    </SelectItem>
                    {deals.map((d) => (
                      <SelectItem
                        key={d.id}
                        value={d.id}
                        className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)] cursor-pointer"
                      >
                        {d.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {state.error && (
            <p className="text-[0.82rem] text-red-400">{state.error}</p>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-7 cursor-pointer"
            >
              {isPending
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Add Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
