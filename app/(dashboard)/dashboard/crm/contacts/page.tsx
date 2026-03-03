import { getServerContext } from "@/lib/supabase/context"
import { ContactsList } from "@/components/crm/ContactsList"
import { getUiConfig } from "@/lib/actions/ui-config"
import { applyCustomFilters, applyCustomSort } from "@/lib/utils/ui-config-helpers"
import type { Contact } from "@/lib/types/crm"

export default async function ContactsPage({
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
  const uiConfig = await getUiConfig("contacts")

  // Determine sort order
  let orderColumn = "created_at"
  let ascending = false
  let customSortApplied = false

  if (sort === "name") {
    orderColumn = "first_name"
    ascending = true
  } else if (sort === "company") {
    orderColumn = "company_id"
    ascending = true
  }

  let query = supabase
    .from("contacts")
    .select("*, company:companies(id, name)")
    .eq("org_id", orgId)

  if (q) {
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
  }

  // Apply custom filters
  query = applyCustomFilters(query, uiConfig.filters, params)

  // Apply custom sort if not a built-in sort
  if (sort && !["recent", "name", "company"].includes(sort)) {
    const result = applyCustomSort(query, uiConfig, sort)
    query = result.query
    customSortApplied = result.applied
  }

  // Apply built-in sort if no custom sort was applied
  if (!customSortApplied) {
    query = query.order(orderColumn, { ascending })
  }

  const [{ data: contacts }, { data: companies }] = await Promise.all([
    query,
    supabase.from("companies").select("id, name").eq("org_id", orgId).order("name"),
  ])

  return (
    <ContactsList
      contacts={(contacts ?? []) as Contact[]}
      companies={companies ?? []}
      searchQuery={q ?? ""}
      currentSort={sort ?? "recent"}
      uiConfig={uiConfig}
    />
  )
}
