"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { BlockProps, ListConfig } from "@/lib/blocks/types"

export function ListBlock({ config, orgId }: BlockProps<ListConfig>) {
  const [items, setItems] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      let query = supabase
        .from(config.data_source)
        .select("*")
        .eq("org_id", orgId)
        .limit(config.limit)

      if (config.filter) {
        for (const [key, val] of Object.entries(config.filter)) {
          query = query.eq(key, val as string)
        }
      }

      const { data } = await query
      setItems(data || [])
      setLoading(false)
    }
    fetchData()
  }, [config, orgId])

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden h-full">
      {config.title && (
        <div className="px-7 py-5 border-b border-[var(--border)]">
          <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
            {config.title}
          </h3>
        </div>
      )}
      <div>
        {loading ? (
          <div className="px-7 py-8 text-center text-[var(--text-dim)] text-sm">
            Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="px-7 py-8 text-center text-[var(--text-dim)] text-sm font-light">
            No items found
          </div>
        ) : (
          items.map((item, i) => {
            const displayValue = String(item[config.display_field] ?? "")
            const secondaryValue = config.secondary_field
              ? String(item[config.secondary_field] ?? "")
              : null
            const href = config.link_template
              ? config.link_template.replace("{id}", String(item.id))
              : undefined

            const content = (
              <div
                className="px-7 py-4 flex items-center justify-between hover:bg-[rgba(232,224,212,0.02)] transition-colors"
                style={
                  i < items.length - 1
                    ? { borderBottom: "1px solid rgba(42,37,32,0.5)" }
                    : undefined
                }
              >
                <div>
                  <p className="text-[0.85rem] text-[var(--text)] font-light">
                    {displayValue}
                  </p>
                  {secondaryValue && (
                    <p className="text-[0.7rem] text-[var(--text-dim)] font-light mt-0.5">
                      {secondaryValue}
                    </p>
                  )}
                </div>
              </div>
            )

            return href ? (
              <Link key={String(item.id || i)} href={href}>
                {content}
              </Link>
            ) : (
              <div key={String(item.id || i)}>{content}</div>
            )
          })
        )}
      </div>
    </div>
  )
}
