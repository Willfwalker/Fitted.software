import { getServerContext } from "@/lib/supabase/context"
import { ContactsList } from "@/components/crm/ContactsList"
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

  let orderColumn = "created_at"
  let ascending = false

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

  query = query.order(orderColumn, { ascending })

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
    />
  )
}
