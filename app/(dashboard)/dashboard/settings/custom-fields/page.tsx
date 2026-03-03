import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CustomFieldsEditor } from "@/components/crm/CustomFieldsEditor"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { UiConfig, EntityType } from "@/lib/types/ui-config"

export default async function CustomFieldsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: membership } = await supabase
    .from("organization_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .single()

  if (!membership) redirect("/login")

  if (!["OWNER", "ADMIN"].includes(membership.role)) {
    redirect("/dashboard/settings")
  }

  const { data: configs } = await supabase
    .from("ui_configs")
    .select("entity_type, config")
    .eq("org_id", membership.org_id)

  const configMap: Record<EntityType, UiConfig> = {
    contacts: { fields: [] },
    companies: { fields: [] },
    deals: { fields: [] },
    invoices: { fields: [] },
    reports: { fields: [] },
    dashboard: { fields: [] },
  }

  for (const row of configs ?? []) {
    configMap[row.entity_type as EntityType] = row.config as UiConfig
  }

  return (
    <div className="p-8 lg:p-12 max-w-[700px] space-y-6">
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-1.5 text-[0.82rem] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors font-light"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Settings
      </Link>

      <div>
        <h1 className="font-[family-name:var(--font-display)] text-[1.8rem] text-[var(--text)] tracking-tight leading-tight">
          Custom Features
        </h1>
      </div>

      <CustomFieldsEditor initialConfigs={configMap} />
    </div>
  )
}
