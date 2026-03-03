import type { UiConfig, FilterDef } from "@/lib/types/ui-config"

/**
 * Apply custom filters from UiConfig to a Supabase query based on URL search params.
 * Reads `filter_{key}` params and applies .eq() / .gte() / .lte() accordingly.
 */
export function applyCustomFilters<T>(
  query: T,
  filters: FilterDef[] | undefined,
  searchParams: Record<string, string | undefined>
): T {
  if (!filters || filters.length === 0) return query

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = query as any

  for (const filter of filters) {
    const paramValue = searchParams[`filter_${filter.key}`]

    if (filter.type === "select") {
      if (!paramValue) continue
      if (filter.column.startsWith("metadata->>")) {
        const fieldKey = filter.column.replace("metadata->>", "")
        q = q.eq(`metadata->>${fieldKey}`, paramValue)
      } else {
        q = q.eq(filter.column, paramValue)
      }
    } else if (filter.type === "text") {
      if (!paramValue) continue
      if (filter.column.startsWith("metadata->>")) {
        const fieldKey = filter.column.replace("metadata->>", "")
        q = q.ilike(`metadata->>${fieldKey}`, `%${paramValue}%`)
      } else {
        q = q.ilike(filter.column, `%${paramValue}%`)
      }
    } else if (filter.type === "boolean") {
      if (!paramValue) continue
      q = q.eq(filter.column, paramValue === "true")
    } else if (filter.type === "date-range") {
      const from = searchParams[`filter_${filter.key}_from`]
      const to = searchParams[`filter_${filter.key}_to`]
      if (from) {
        if (filter.column.startsWith("metadata->>")) {
          const fieldKey = filter.column.replace("metadata->>", "")
          q = q.gte(`metadata->>${fieldKey}`, from)
        } else {
          q = q.gte(filter.column, from)
        }
      }
      if (to) {
        if (filter.column.startsWith("metadata->>")) {
          const fieldKey = filter.column.replace("metadata->>", "")
          q = q.lte(`metadata->>${fieldKey}`, to)
        } else {
          q = q.lte(filter.column, to)
        }
      }
    }
  }

  return q as T
}

/**
 * Apply a custom sort from UiConfig to a Supabase query.
 * Returns true if a custom sort was applied, false otherwise.
 */
export function applyCustomSort<T>(
  query: T,
  uiConfig: UiConfig,
  sortKey: string | undefined
): { query: T; applied: boolean } {
  if (!sortKey || !uiConfig.sorts || uiConfig.sorts.length === 0) {
    return { query, applied: false }
  }

  const sortDef = uiConfig.sorts.find((s) => s.key === sortKey)
  if (!sortDef) return { query, applied: false }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = query as any

  if (sortDef.column.startsWith("metadata->>")) {
    const fieldKey = sortDef.column.replace("metadata->>", "")
    q = q.order(`metadata->>${fieldKey}`, { ascending: sortDef.ascending })
  } else {
    q = q.order(sortDef.column, { ascending: sortDef.ascending })
  }

  return { query: q as T, applied: true }
}
