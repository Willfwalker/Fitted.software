"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Pencil,
  Trash2,
  X,
  MapPin,
  User,
  Building2,
  Briefcase,
  Clock,
  CalendarDays,
} from "lucide-react"
import { DeleteConfirmDialog } from "@/components/crm/DeleteConfirmDialog"
import { deleteEvent, updateEventStatus } from "@/lib/actions/events"
import { EVENT_STATUSES } from "@/lib/types/scheduling"
import type { CalendarEvent } from "@/lib/types/scheduling"

interface EventDetailSheetProps {
  event: CalendarEvent | null
  onClose: () => void
  onEdit: (event: CalendarEvent) => void
}

export function EventDetailSheet({
  event,
  onClose,
  onEdit,
}: EventDetailSheetProps) {
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)

  if (!event) return null

  const statusConfig = EVENT_STATUSES.find((s) => s.value === event.status)
  const eventColor = event.color || "#D4734E"

  const handleDelete = async () => {
    await deleteEvent(event.id)
    setShowDelete(false)
    onClose()
    router.refresh()
  }

  const handleStatusChange = async (status: string) => {
    await updateEventStatus(event.id, status)
    router.refresh()
    onClose()
  }

  const formatDateTime = (iso: string, allDay: boolean) => {
    const d = new Date(iso)
    if (allDay) {
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    }
    return d.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  return (
    <>
      <Sheet open={!!event} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          showCloseButton={false}
          className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] w-[480px] sm:max-w-[480px] overflow-y-auto"
        >
          {/* Color accent bar */}
          <div
            className="h-1 w-full rounded-full mx-auto max-w-[80%] mt-2 mb-1"
            style={{ backgroundColor: eventColor }}
          />

          <SheetHeader className="px-6 pt-4 pb-0">
            <div className="flex items-start justify-between gap-3">
              <SheetTitle className="font-[family-name:var(--font-display)] text-[1.4rem] text-[var(--text)] tracking-tight leading-tight flex-1">
                {event.title}
              </SheetTitle>
              <div className="flex items-center gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(event)}
                  className="h-8 w-8 text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[rgba(232,224,212,0.05)] cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDelete(true)}
                  className="h-8 w-8 text-[var(--text-dim)] hover:text-red-400 hover:bg-[rgba(239,91,91,0.08)] cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[rgba(232,224,212,0.05)] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          <div className="px-6 pb-6 space-y-6 mt-4">
            {/* Status badge row */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {statusConfig && (
                <Badge
                  variant="outline"
                  className="text-[0.73rem] px-3 py-1 border-0 font-medium rounded-full"
                  style={{
                    color: statusConfig.color,
                    backgroundColor: `${statusConfig.color}18`,
                  }}
                >
                  {statusConfig.label}
                </Badge>
              )}
              {event.all_day && (
                <Badge
                  variant="outline"
                  className="text-[0.73rem] px-3 py-1 border-[var(--border)] text-[var(--text-muted)] rounded-full"
                >
                  All Day
                </Badge>
              )}
              {event.color && (
                <span
                  className="h-3 w-3 rounded-full shrink-0 ring-2 ring-[var(--bg-card)]"
                  style={{ backgroundColor: event.color }}
                />
              )}
            </div>

            {/* Quick status actions */}
            {event.status === "SCHEDULED" && (
              <div className="flex gap-2.5">
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("COMPLETED")}
                  className="bg-[rgba(94,198,154,0.1)] text-[#5EC69A] hover:bg-[rgba(94,198,154,0.2)] text-[0.78rem] rounded-full px-5 h-9 cursor-pointer"
                >
                  Mark Complete
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleStatusChange("CANCELLED")}
                  className="text-[var(--text-muted)] hover:text-[var(--text)] text-[0.78rem] h-9 cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className="space-y-2">
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
                  Description
                </p>
                <p className="text-[0.85rem] text-[var(--text-muted)] font-light leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            {/* Divider */}
            <div className="h-px bg-[var(--border)]" />

            {/* Detail grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Time */}
              <div className="rounded-xl border border-[var(--border)] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock
                    className="h-3.5 w-3.5 text-[var(--accent)]"
                    strokeWidth={1.8}
                  />
                  <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
                    Start
                  </p>
                </div>
                <p className="text-[0.85rem] text-[var(--text)] font-light">
                  {formatDateTime(event.start_at, event.all_day)}
                </p>
              </div>

              {event.end_at && (
                <div className="rounded-xl border border-[var(--border)] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarDays
                      className="h-3.5 w-3.5 text-[var(--accent)]"
                      strokeWidth={1.8}
                    />
                    <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
                      End
                    </p>
                  </div>
                  <p className="text-[0.85rem] text-[var(--text)] font-light">
                    {formatDateTime(event.end_at, event.all_day)}
                  </p>
                </div>
              )}

              {event.location && (
                <div className="rounded-xl border border-[var(--border)] p-4 col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin
                      className="h-3.5 w-3.5 text-[var(--accent)]"
                      strokeWidth={1.8}
                    />
                    <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
                      Location
                    </p>
                  </div>
                  <p className="text-[0.85rem] text-[var(--text)] font-light">
                    {event.location}
                  </p>
                </div>
              )}

              {event.contact && (
                <div className="rounded-xl border border-[var(--border)] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User
                      className="h-3.5 w-3.5 text-[var(--accent)]"
                      strokeWidth={1.8}
                    />
                    <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
                      Contact
                    </p>
                  </div>
                  <p className="text-[0.85rem] text-[var(--text)] font-light">
                    {event.contact.first_name} {event.contact.last_name}
                  </p>
                </div>
              )}

              {event.company && (
                <div className="rounded-xl border border-[var(--border)] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2
                      className="h-3.5 w-3.5 text-[var(--accent)]"
                      strokeWidth={1.8}
                    />
                    <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
                      Company
                    </p>
                  </div>
                  <p className="text-[0.85rem] text-[var(--text)] font-light">
                    {event.company.name}
                  </p>
                </div>
              )}

              {event.deal && (
                <div className="rounded-xl border border-[var(--border)] p-4 col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase
                      className="h-3.5 w-3.5 text-[var(--accent)]"
                      strokeWidth={1.8}
                    />
                    <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
                      Deal
                    </p>
                  </div>
                  <p className="text-[0.85rem] text-[var(--text)] font-light">
                    {event.deal.title}
                  </p>
                </div>
              )}
            </div>

            {/* Timestamps */}
            <div className="pt-4 border-t border-[var(--border)]">
              <p className="text-[0.72rem] text-[var(--text-dim)] font-light">
                Created{" "}
                {new Date(event.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirm */}
      {showDelete && (
        <DeleteConfirmDialog
          open={showDelete}
          onOpenChange={setShowDelete}
          onConfirm={handleDelete}
          title="Delete Event"
          description={`Are you sure you want to delete "${event.title}"? This action cannot be undone.`}
        />
      )}
    </>
  )
}
