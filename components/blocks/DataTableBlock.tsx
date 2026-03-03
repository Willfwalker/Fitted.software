"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Search } from "lucide-react"
import type { BlockProps, DataTableConfig } from "@/lib/blocks/types"

export function DataTableBlock({ config, orgId }: BlockProps<DataTableConfig>) {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const supabase = createClient()
      let query = supabase
        .from(config.data_source)
        .select("*")
        .eq("org_id", orgId)
        .limit(config.page_size)

      if (config.filters) {
        for (const [key, val] of Object.entries(config.filters)) {
          query = query.eq(key, val as string)
        }
      }

      const { data: rows } = await query
      setData(rows || [])
      setLoading(false)
    }
    fetchData()
  }, [config, orgId])

  const columns =
    config.columns.length > 0
      ? config.columns
      : data.length > 0
        ? Object.keys(data[0])
            .filter((k) => !["id", "org_id", "created_by"].includes(k))
            .slice(0, 6)
            .map((k) => ({ key: k, label: k.replace(/_/g, " "), sortable: false }))
        : []

  const filtered = search
    ? data.filter((row) =>
        columns.some((col) =>
          String(row[col.key] ?? "")
            .toLowerCase()
            .includes(search.toLowerCase())
        )
      )
    : data

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden h-full">
      <div className="px-7 py-5 border-b border-[var(--border)] flex items-center justify-between">
        <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
          {config.title || config.data_source}
        </h3>
        {config.show_search && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-dim)]" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-[0.75rem] bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="px-7 py-12 text-center text-[var(--text-dim)] text-sm">
          Loading...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-7 py-3 text-left text-[0.65rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-7 py-10 text-center text-[var(--text-dim)] text-sm"
                  >
                    No data found
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => (
                  <tr
                    key={String(row.id || i)}
                    className="border-b border-[rgba(42,37,32,0.5)] last:border-0 hover:bg-[rgba(232,224,212,0.02)] transition-colors"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-7 py-3.5 text-[0.82rem] text-[var(--text-muted)] font-light"
                      >
                        {formatCell(row[col.key])}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—"
  if (typeof value === "object") return JSON.stringify(value)
  if (typeof value === "boolean") return value ? "Yes" : "No"
  return String(value)
}
