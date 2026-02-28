"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { BlockProps, KanbanConfig } from "@/lib/blocks/types"

export function KanbanBlock({ config, orgId }: BlockProps<KanbanConfig>) {
  const [columns, setColumns] = useState<
    Record<string, Record<string, unknown>[]>
  >({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
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
      const grouped: Record<string, Record<string, unknown>[]> = {}
      for (const row of data || []) {
        const stage = String(row[config.stage_field] ?? "Unknown")
        if (!grouped[stage]) grouped[stage] = []
        grouped[stage].push(row)
      }
      setColumns(grouped)
      setLoading(false)
    }
    fetchData()
  }, [config, orgId])

  const stageNames = Object.keys(columns)

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden h-full">
      {config.title && (
        <div className="px-7 py-5 border-b border-[var(--border)]">
          <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
            {config.title}
          </h3>
        </div>
      )}

      {loading ? (
        <div className="px-7 py-8 text-center text-[var(--text-dim)] text-sm">
          Loading...
        </div>
      ) : stageNames.length === 0 ? (
        <div className="px-7 py-8 text-center text-[var(--text-dim)] text-sm font-light">
          No items found
        </div>
      ) : (
        <div className="flex gap-4 p-5 overflow-x-auto">
          {stageNames.map((stage) => (
            <div
              key={stage}
              className="min-w-[220px] flex-1 bg-[var(--bg-elevated)] rounded-xl p-3"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
                  {stage}
                </span>
                <span className="text-[0.6rem] text-[var(--text-dim)] bg-[var(--bg-card)] px-2 py-0.5 rounded-full">
                  {columns[stage].length}
                </span>
              </div>
              <div className="space-y-2">
                {columns[stage].map((item, i) => (
                  <div
                    key={String(item.id || i)}
                    className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3"
                  >
                    <p className="text-[0.82rem] text-[var(--text)] font-light">
                      {String(item[config.card_title_field] ?? "")}
                    </p>
                    {config.card_subtitle_field &&
                      item[config.card_subtitle_field] && (
                        <p className="text-[0.7rem] text-[var(--text-dim)] font-light mt-1">
                          {String(item[config.card_subtitle_field])}
                        </p>
                      )}
                    {config.card_value_field &&
                      item[config.card_value_field] && (
                        <p className="text-[0.7rem] text-[var(--accent)] font-medium mt-1">
                          ${Number(item[config.card_value_field]).toLocaleString()}
                        </p>
                      )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
