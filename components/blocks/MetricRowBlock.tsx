"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import * as LucideIcons from "lucide-react"
import type { BlockProps, MetricRowConfig } from "@/lib/blocks/types"

export function MetricRowBlock({ config, orgId }: BlockProps<MetricRowConfig>) {
  const [values, setValues] = useState<(number | null)[]>(
    config.metrics.map(() => null)
  )

  useEffect(() => {
    async function fetchAll() {
      const supabase = createClient()
      const results = await Promise.all(
        config.metrics.map(async (metric) => {
          if (metric.aggregate === "count") {
            let query = supabase
              .from(metric.data_source)
              .select("*", { count: "exact", head: true })
              .eq("org_id", orgId)
            if (metric.filter) {
              for (const [k, v] of Object.entries(metric.filter)) {
                query = query.eq(k, v as string)
              }
            }
            const { count } = await query
            return count ?? 0
          }

          const field = metric.aggregate_field || "value"
          let query = supabase.from(metric.data_source).select(field).eq("org_id", orgId)
          if (metric.filter) {
            for (const [k, v] of Object.entries(metric.filter)) {
              query = query.eq(k, v as string)
            }
          }
          const { data } = await query
          if (!data) return 0
          const nums = data.map((d: Record<string, unknown>) => Number(d[field]) || 0)
          if (metric.aggregate === "sum")
            return nums.reduce((a, b) => a + b, 0)
          if (metric.aggregate === "avg")
            return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
          return nums.length
        })
      )
      setValues(results)
    }
    fetchAll()
  }, [config, orgId])

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(config.metrics.length, 4)}, 1fr)` }}>
      {config.metrics.map((metric, i) => {
        const IconComp = metric.icon
          ? (LucideIcons as Record<string, any>)[metric.icon]
          : null
        const val = values[i]
        const display =
          val === null
            ? "—"
            : metric.format === "currency"
              ? `$${val.toLocaleString()}`
              : metric.format === "percent"
                ? `${val.toFixed(1)}%`
                : String(val)

        return (
          <div
            key={i}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              {IconComp && (
                <IconComp
                  className="w-3.5 h-3.5 text-[var(--accent)]"
                  strokeWidth={2}
                />
              )}
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.12em] text-[var(--text-dim)]">
                {metric.title}
              </p>
            </div>
            <p className="font-[family-name:var(--font-display)] text-[1.8rem] text-[var(--text)] leading-none tracking-tight">
              {display}
            </p>
          </div>
        )
      })}
    </div>
  )
}
