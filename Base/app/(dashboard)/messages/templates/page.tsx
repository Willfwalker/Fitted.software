import { getServerContext } from "@/lib/supabase/context"
import { redirect } from "next/navigation"
import { TemplateList } from "@/components/messages/TemplateList"
import type { MessageTemplate } from "@/lib/types/messaging"

export default async function TemplatesPage() {
  const ctx = await getServerContext()
  if (!ctx) redirect("/login")

  const { data: templates } = await ctx.supabase
    .from("message_templates")
    .select("*")
    .eq("org_id", ctx.orgId)
    .order("created_at", { ascending: false })

  return (
    <div className="p-6 sm:p-8 lg:p-12 max-w-[1400px] space-y-6">
      <div className="animate-dash-in">
        <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-[var(--accent)] mb-2 block">
          Communications
        </span>
        <h1 className="font-[family-name:var(--font-display)] text-[2.2rem] text-[var(--text)] tracking-tight leading-tight">
          Templates
        </h1>
      </div>

      <TemplateList templates={(templates ?? []) as MessageTemplate[]} />
    </div>
  )
}
