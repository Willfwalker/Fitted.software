"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useNextCalendarApp, ScheduleXCalendar } from "@schedule-x/react"
import {
  createViewDay,
  createViewWeek,
  createViewMonthGrid,
  createViewMonthAgenda,
} from "@schedule-x/calendar"
import { createEventsServicePlugin } from "@schedule-x/events-service"
import { createDragAndDropPlugin } from "@schedule-x/drag-and-drop"
import "temporal-polyfill/global"
import "@schedule-x/theme-default/dist/index.css"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EventForm } from "./EventForm"
import { EventDetailSheet } from "./EventDetailSheet"
import { updateEventTime } from "@/lib/actions/events"
import type { CalendarEvent } from "@/lib/types/scheduling"

interface CalendarViewProps {
  events: CalendarEvent[]
  contacts: { id: string; first_name: string; last_name: string }[]
  companies: { id: string; name: string }[]
  deals: { id: string; title: string }[]
  members: { id: string; email: string; name: string }[]
}

function toScheduleXDate(
  iso: string,
  allDay: boolean
): Temporal.PlainDate | Temporal.ZonedDateTime {
  const d = new Date(iso)
  const yyyy = d.getFullYear()
  const mm = d.getMonth() + 1
  const dd = d.getDate()
  if (allDay) {
    return Temporal.PlainDate.from({ year: yyyy, month: mm, day: dd })
  }
  return Temporal.ZonedDateTime.from({
    year: yyyy,
    month: mm,
    day: dd,
    hour: d.getHours(),
    minute: d.getMinutes(),
    timeZone: Temporal.Now.timeZoneId(),
  })
}

function fromScheduleXDate(
  sxDate: string | Temporal.PlainDate | Temporal.ZonedDateTime
): string {
  if (typeof sxDate === "string") {
    if (sxDate.length === 10) {
      return new Date(`${sxDate}T00:00:00`).toISOString()
    }
    const [datePart, timePart] = sxDate.split(" ")
    return new Date(`${datePart}T${timePart}:00`).toISOString()
  }
  if (sxDate instanceof Temporal.PlainDate) {
    return new Date(
      `${sxDate.year}-${String(sxDate.month).padStart(2, "0")}-${String(sxDate.day).padStart(2, "0")}T00:00:00`
    ).toISOString()
  }
  // ZonedDateTime
  return new Date(sxDate.epochMilliseconds).toISOString()
}

export function CalendarView({
  events,
  contacts,
  companies,
  deals,
  members,
}: CalendarViewProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [formDefaults, setFormDefaults] = useState<{
    start_at?: string
    end_at?: string
    all_day?: boolean
  }>({})
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null)

  const eventsService = useState(() => createEventsServicePlugin())[0]

  // Blend hex with dark bg to get a solid container color
  function blendWithDark(hex: string, mix: number): string {
    const bg = { r: 26, g: 24, b: 22 } // #1A1816
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgb(${Math.round(bg.r + (r - bg.r) * mix)}, ${Math.round(bg.g + (g - bg.g) * mix)}, ${Math.round(bg.b + (b - bg.b) * mix)})`
  }

  const sxEvents = useMemo(
    () =>
      events.map((e) => ({
        id: e.id,
        title: e.title,
        start: toScheduleXDate(e.start_at, e.all_day),
        end: e.end_at
          ? toScheduleXDate(e.end_at, e.all_day)
          : toScheduleXDate(e.start_at, e.all_day),
        _original: e,
      })),
    [events]
  )

  // Inject per-event color styles directly via <style> tag
  // This bypasses the Schedule-X calendar color system entirely
  const eventStyles = useMemo(() => {
    const defaultColor = "#D4734E"
    const hexPattern = /^#[0-9A-Fa-f]{6}$/
    const uuidPattern = /^[0-9a-f-]{36}$/
    return events
      .map((e) => {
        if (!uuidPattern.test(e.id)) return ""
        const hex = hexPattern.test(e.color || "") ? e.color! : defaultColor
        const containerBg = blendWithDark(hex, 0.45)
        return `[data-event-id="${e.id}"]{background-color:${containerBg} !important;border-left:3px solid ${hex} !important;color:#F0E8DC !important}`
      })
      .join("\n")
  }, [events])

  const handleEventClick = useCallback(
    (calendarEvent: { id: string | number; _original?: CalendarEvent }) => {
      const original =
        calendarEvent._original ??
        events.find((e) => e.id === String(calendarEvent.id))
      if (original) setSelectedEvent(original)
    },
    [events]
  )

  const handleEventUpdate = useCallback(
    async (updatedEvent: {
      id: string | number
      start: string | Temporal.PlainDate | Temporal.ZonedDateTime
      end: string | Temporal.PlainDate | Temporal.ZonedDateTime
    }) => {
      const startAt = fromScheduleXDate(updatedEvent.start)
      const endAt = fromScheduleXDate(updatedEvent.end)
      await updateEventTime(String(updatedEvent.id), startAt, endAt)
      router.refresh()
    },
    [router]
  )

  const handleClickDateTime = useCallback(
    (dateTime: string | Temporal.PlainDate | Temporal.ZonedDateTime) => {
      const iso = fromScheduleXDate(dateTime)
      const endIso = new Date(
        new Date(iso).getTime() + 60 * 60 * 1000
      ).toISOString()
      setFormDefaults({ start_at: iso, end_at: endIso, all_day: false })
      setShowForm(true)
    },
    []
  )

  const calendar = useNextCalendarApp({
    views: [
      createViewWeek(),
      createViewDay(),
      createViewMonthGrid(),
      createViewMonthAgenda(),
    ],
    defaultView: "week",
    isDark: true,
    locale: "en-US",
    firstDayOfWeek: 7,
    dayBoundaries: { start: "06:00", end: "22:00" },
    weekOptions: {
      gridHeight: 1100,
      eventWidth: 95,
    },
    monthGridOptions: {
      nEventsPerDay: 4,
    },
    events: sxEvents,
    callbacks: {
      onEventClick: handleEventClick,
      onEventUpdate: handleEventUpdate,
      onClickDateTime: handleClickDateTime,
    },
    plugins: [eventsService, createDragAndDropPlugin()],
  })

  return (
    <div className="space-y-4">
      {/* eslint-disable-next-line react/no-danger -- trusted DB content, sanitized with regex */}
      <style dangerouslySetInnerHTML={{ __html: eventStyles }} />

      {/* Toolbar */}
      <div className="flex items-center justify-end">
        <Button
          onClick={() => {
            setFormDefaults({})
            setEditEvent(null)
            setShowForm(true)
          }}
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-5 text-[0.84rem] cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Event
        </Button>
      </div>

      {/* Calendar */}
      <div className="rounded-xl border border-[var(--border)] overflow-hidden sx-fitted-calendar">
        <ScheduleXCalendar calendarApp={calendar} />
      </div>

      {/* Event form dialog */}
      <EventForm
        open={showForm || !!editEvent}
        onOpenChange={(open) => {
          if (!open) {
            setShowForm(false)
            setEditEvent(null)
            setFormDefaults({})
          }
        }}
        contacts={contacts}
        companies={companies}
        deals={deals}
        members={members}
        event={editEvent ?? undefined}
        defaults={formDefaults}
      />

      {/* Event detail sheet */}
      <EventDetailSheet
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={(e) => {
          setSelectedEvent(null)
          setEditEvent(e)
        }}
      />
    </div>
  )
}
