import { getServerContext } from "@/lib/supabase/context"
import { CompanyList } from "@/components/crm/CompanyList"
import { hasPermission } from "@/lib/rbac/permissions"
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

  let orderColumn = "created_at"
  let ascending = false

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

  query = query.order(orderColumn, { ascending })

  const { data: companies } = await query

  const canDelete = hasPermission(ctx.role, "records:delete")

  return (
    <CompanyList
      companies={(companies ?? []) as Company[]}
      searchQuery={q ?? ""}
      currentSort={sort ?? "recent"}
      canDelete={canDelete}
    />
  )
}
