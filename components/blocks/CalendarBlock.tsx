"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { BlockProps, CalendarConfig } from "@/lib/blocks/types"

interface CalendarEvent {
  id: string
  title: string
  date: string
  color?: string
}

export function CalendarBlock({ config, orgId }: BlockProps<CalendarConfig>) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const supabase = createClient()
      let query = supabase
        .from(config.data_source)
        .select("*")
        .eq("org_id", orgId)

      if (config.filter) {
        for (const [key, val] of Object.entries(config.filter)) {
          query = query.eq(key, val as string)
        }
      }

      const { data } = await query
      const mapped = (data || [])
        .filter((row) => row[config.date_field])
        .map((row) => ({
          id: row.id,
          title: String(row[config.title_field] ?? ""),
          date: String(row[config.date_field]),
          color: config.color_field ? String(row[config.color_field] ?? "") : undefined,
        }))
      setEvents(mapped)
      setLoading(false)
    }
    fetchData()
  }, [config, orgId])

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  function getEventsForDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return events.filter((e) => e.date.startsWith(dateStr))
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden h-full">
      <div className="px-7 py-5 border-b border-[var(--border)] flex items-center justify-between">
        <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
          {config.title || "Calendar"}
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              setCurrentMonth(new Date(year, month - 1, 1))
            }
            className="text-[var(--text-dim)] hover:text-[var(--text)] text-sm"
          >
            &lt;
          </button>
          <span className="text-[0.8rem] text-[var(--text-muted)] font-light">
            {currentMonth.toLocaleString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </span>
          <button
            onClick={() =>
              setCurrentMonth(new Date(year, month + 1, 1))
            }
            className="text-[var(--text-dim)] hover:text-[var(--text)] text-sm"
          >
            &gt;
          </button>
        </div>
      </div>

      {loading ? (
        <div className="px-7 py-8 text-center text-[var(--text-dim)] text-sm">
          Loading...
        </div>
      ) : (
        <div className="p-5">
          <div className="grid grid-cols-7 gap-px mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-center text-[0.6rem] font-medium uppercase tracking-[0.1em] text-[var(--text-dim)] py-1"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px">
            {days.map((day, i) => {
              const dayEvents = day ? getEventsForDay(day) : []
              return (
                <div
                  key={i}
                  className="min-h-[60px] p-1 bg-[var(--bg-elevated)] rounded"
                >
                  {day && (
                    <>
                      <span className="text-[0.7rem] text-[var(--text-dim)] font-light">
                        {day}
                      </span>
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className="mt-0.5 text-[0.55rem] text-[var(--text-muted)] bg-[rgba(212,115,78,0.1)] px-1 py-0.5 rounded truncate"
                        >
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[0.5rem] text-[var(--text-dim)] mt-0.5 px-1">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
