"use server"

import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "./helpers"
import { revalidatePath } from "next/cache"
import { ALL_MODULES, ALL_MODULE_KEYS, type ModuleKey } from "@/lib/config/modules"

export async function updateEnabledModules(modules: ModuleKey[]) {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  // Validate all keys are real module keys
  const valid = modules.every((k) => ALL_MODULE_KEYS.includes(k))
  if (!valid) return { error: "Invalid module key" }

  const supabase = await createClient()
  const { error } = await supabase
    .from("organizations")
    .update({ enabled_modules: modules })
    .eq("id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/settings")
  revalidatePath("/dashboard", "layout")
  for (const mod of ALL_MODULES) {
    revalidatePath(mod.href, "layout")
  }
  return { data: modules }
}
