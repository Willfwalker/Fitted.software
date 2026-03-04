import { getServerContext } from "@/lib/supabase/context"
import { CalendarView } from "@/components/calendar/CalendarView"
import type { CalendarEvent } from "@/lib/types/scheduling"

export default async function CalendarPage() {
  const ctx = await getServerContext()
  if (!ctx) return null

  const { supabase, orgId } = ctx

  // Fetch events, CRM data, and members in parallel
  const [
    { data: events },
    { data: contacts },
    { data: companies },
    { data: deals },
    { data: members },
  ] = await Promise.all([
    supabase
      .from("calendar_events")
      .select(
        "*, contact:contacts(id, first_name, last_name), company:companies(id, name), deal:deals(id, title)"
      )
      .eq("org_id", orgId)
      .order("start_at", { ascending: true }),
    supabase
      .from("contacts")
      .select("id, first_name, last_name")
      .eq("org_id", orgId)
      .order("first_name"),
    supabase
      .from("companies")
      .select("id, name")
      .eq("org_id", orgId)
      .order("name"),
    supabase
      .from("deals")
      .select("id, title")
      .eq("org_id", orgId)
      .order("title"),
    supabase
      .from("organization_members")
      .select("user_id, users:user_id(id, email, raw_user_meta_data)")
      .eq("org_id", orgId),
  ])

  // Build members list
  const membersList = (members ?? []).map((m) => {
    const user = m.users as unknown as {
      id: string
      email: string
      raw_user_meta_data: Record<string, unknown>
    } | null
    return {
      id: user?.id ?? m.user_id,
      email: user?.email ?? "",
      name:
        (user?.raw_user_meta_data?.full_name as string) ?? user?.email ?? "",
    }
  })

  return (
    <div className="p-6 sm:p-8 lg:p-12 max-w-[1600px] space-y-6">
      <div className="animate-dash-in" style={{ animationDelay: "60ms" }}>
        <CalendarView
          events={(events ?? []) as CalendarEvent[]}
          contacts={contacts ?? []}
          companies={companies ?? []}
          deals={deals ?? []}
          members={membersList}
        />
      </div>
    </div>
  )
}
