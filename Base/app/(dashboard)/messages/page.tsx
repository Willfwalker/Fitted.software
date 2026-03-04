import { getServerContext } from "@/lib/supabase/context"
import { redirect } from "next/navigation"
import { MessageList } from "@/components/messages/MessageList"
import type { Message } from "@/lib/types/messaging"
import type { Contact } from "@/lib/types/crm"
import type { MessageTemplate } from "@/lib/types/messaging"

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const ctx = await getServerContext()
  if (!ctx) redirect("/login")

  const params = await searchParams
  const search = params.q || ""
  const status = params.status || ""

  let query = ctx.supabase
    .from("messages")
    .select("*, contact:contacts(id, first_name, last_name, email), company:companies(id, name), deal:deals(id, title), template:message_templates(id, name)")
    .eq("org_id", ctx.orgId)

  if (status && status !== "all") {
    query = query.eq("status", status)
  }

  if (search) {
    query = query.or(`subject.ilike.%${search}%,recipient_email.ilike.%${search}%,recipient_name.ilike.%${search}%`)
  }

  query = query.order("created_at", { ascending: false })

  const { data: messages } = await query

  // Fetch contacts for compose dialog
  const { data: contacts } = await ctx.supabase
    .from("contacts")
    .select("id, first_name, last_name, email")
    .eq("org_id", ctx.orgId)
    .order("first_name")

  // Fetch templates for compose dialog
  const { data: templates } = await ctx.supabase
    .from("message_templates")
    .select("*")
    .eq("org_id", ctx.orgId)
    .order("name")

  return (
    <div className="p-6 sm:p-8 lg:p-12 max-w-[1400px] space-y-6">
      <div className="animate-dash-in">
        <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-[var(--accent)] mb-2 block">
          Communications
        </span>
        <h1 className="font-[family-name:var(--font-display)] text-[2.2rem] text-[var(--text)] tracking-tight leading-tight">
          Messages
        </h1>
      </div>

      <MessageList
        messages={(messages ?? []) as Message[]}
        contacts={(contacts ?? []) as Pick<Contact, "id" | "first_name" | "last_name" | "email">[]}
        templates={(templates ?? []) as MessageTemplate[]}
        searchQuery={search}
        currentStatus={status}
      />
    </div>
  )
}
