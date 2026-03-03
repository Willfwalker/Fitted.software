import { getServerContext } from "@/lib/supabase/context"
import { CompanyList } from "@/components/crm/CompanyList"
import { getUiConfig } from "@/lib/actions/ui-config"
import { applyCustomFilters, applyCustomSort } from "@/lib/utils/ui-config-helpers"
import type { Company } from "@/lib/types/crm"

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const q = params.q
  const sort = params.sort
  const ctx = await getServerContext()
  if (!ctx) return null

  const { supabase, orgId } = ctx

  // Fetch uiConfig first (needed for sort/filter application)
  const uiConfig = await getUiConfig("companies")

  // Determine sort order
  let orderColumn = "created_at"
  let ascending = false
  let customSortApplied = false

  if (sort === "name") {
    orderColumn = "name"
    ascending = true
  }

  let query = supabase
    .from("companies")
    .select("*")
    .eq("org_id", orgId)

  if (q) {
    query = query.or(`name.ilike.%${q}%,domain.ilike.%${q}%,industry.ilike.%${q}%`)
  }

  // Apply custom filters
  query = applyCustomFilters(query, uiConfig.filters, params)

  // Apply custom sort if not a built-in sort
  if (sort && !["recent", "name"].includes(sort)) {
    const result = applyCustomSort(query, uiConfig, sort)
    query = result.query
    customSortApplied = result.applied
  }

  // Apply built-in sort if no custom sort was applied
  if (!customSortApplied) {
    query = query.order(orderColumn, { ascending })
  }

  const { data: companies } = await query

  return (
    <CompanyList
      companies={(companies ?? []) as Company[]}
      searchQuery={q ?? ""}
      currentSort={sort ?? "recent"}
      uiConfig={uiConfig}
    />
  )
}
