"use server"

import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "@/lib/actions/helpers"
import type { UiConfig, EntityType } from "@/lib/types/ui-config"

export const getUiConfig = cache(async (entityType: EntityType): Promise<UiConfig> => {
  const supabase = await createClient()
  const ctx = await getOrgId()
  if (!ctx) return { fields: [] }

  const { data } = await supabase
    .from("ui_configs")
    .select("config")
    .eq("org_id", ctx.orgId)
    .eq("entity_type", entityType)
    .single()

  if (data?.config) {
    return data.config as UiConfig
  }

  return { fields: [] }
})

export async function updateUiConfig(
  entityType: EntityType,
  config: UiConfig
): Promise<void> {
  const supabase = await createClient()
  const ctx = await getOrgId()
  if (!ctx) throw new Error("Not authenticated")

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Not authenticated")

  await supabase.from("ui_configs").upsert(
    {
      org_id: ctx.orgId,
      entity_type: entityType,
      config,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "org_id,entity_type" }
  )
}
