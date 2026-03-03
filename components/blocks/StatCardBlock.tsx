"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import * as LucideIcons from "lucide-react"
import type { BlockProps, StatCardConfig } from "@/lib/blocks/types"

export function StatCardBlock({ config, orgId }: BlockProps<StatCardConfig>) {
  const [value, setValue] = useState<string>("—")
  const [subtitle, setSubtitle] = useState<string>(config.subtitle || "")

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()

      // Main metric
      const mainVal = await fetchAggregate(
        supabase,
        config.data_source,
        config.aggregate,
        config.aggregate_field,
        config.filter,
        orgId
      )

      if (config.format === "currency") {
        setValue(`$${Number(mainVal).toLocaleString()}`)
      } else {
        setValue(String(mainVal))
      }

      // Subtitle metric
      if (config.subtitle_source && config.subtitle_aggregate) {
        const subVal = await fetchAggregate(
          supabase,
          config.subtitle_source,
          config.subtitle_aggregate,
          config.subtitle_field,
          config.subtitle_filter,
          orgId
        )
        const template = config.subtitle_template || "{value}"
        const formatted = template.includes("$")
          ? template.replace("{value}", Number(subVal).toLocaleString())
          : template.replace("{value}", String(subVal))
        setSubtitle(formatted)
      }
    }
    fetchData()
  }, [config, orgId])

  const IconComp = config.icon
    ? (LucideIcons as Record<string, any>)[config.icon]
    : null

  return (
    <div className="group relative rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-7 transition-all duration-300 hover:border-[rgba(212,115,78,0.2)] overflow-hidden h-full">
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500" />

      {IconComp && (
        <IconComp
          className="absolute -bottom-3 -right-3 w-24 h-24 text-[var(--text)] opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500 pointer-events-none"
          strokeWidth={1}
        />
      )}

      <div className="flex items-center gap-2.5 mb-5">
        {IconComp ? (
          <div className="w-7 h-7 rounded-lg bg-[rgba(212,115,78,0.08)] flex items-center justify-center">
            <IconComp
              className="w-3.5 h-3.5 text-[var(--accent)]"
              strokeWidth={2}
            />
          </div>
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
        )}
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
          {config.title}
        </p>
      </div>

      <p className="font-[family-name:var(--font-display)] text-[2.6rem] text-[var(--text)] leading-none tracking-tight">
        {value}
      </p>

      {subtitle && (
        <p className="mt-3 text-xs font-medium text-[var(--text-dim)]">
          {subtitle}
        </p>
      )}
    </div>
  )
}

async function fetchAggregate(
  supabase: ReturnType<typeof createClient>,
  table: string,
  aggregate: string,
  field?: string,
  filter?: Record<string, unknown>,
  orgId?: string
): Promise<number> {
  if (aggregate === "count") {
    let query = supabase
      .from(table)
      .select("*", { count: "exact", head: true })
    if (orgId) query = query.eq("org_id", orgId)
    query = applyFilters(query, filter)
    const { count } = await query
    return count ?? 0
  }

  const selectField = field || "value"
  let query = supabase.from(table).select(selectField)
  if (orgId) query = query.eq("org_id", orgId)
  query = applyFilters(query, filter)
  const { data } = await query

  if (!data || data.length === 0) return 0

  const values = data.map((d: Record<string, unknown>) =>
    Number(d[selectField]) || 0
  )
  if (aggregate === "sum") return values.reduce((a, b) => a + b, 0)
  if (aggregate === "avg")
    return values.reduce((a, b) => a + b, 0) / values.length
  return values.length
}

function applyFilters(query: any, filter?: Record<string, unknown>) {
  if (!filter) return query
  for (const [key, val] of Object.entries(filter)) {
    if (key === "stage") query = query.eq("stage", val)
    else if (key === "stage_not_in" && Array.isArray(val))
      query = query.not("stage", "in", `(${val.join(",")})`)
    else if (key === "status") query = query.eq("status", val)
    else if (key === "priority") query = query.eq("priority", val)
    else query = query.eq(key, val)
  }
  return query
}
