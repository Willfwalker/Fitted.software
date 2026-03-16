"use server"

import { requirePermission } from "@/lib/rbac/require"
import { revalidatePath } from "next/cache"
import { ALL_MODULES, ALL_MODULE_KEYS, type ModuleKey } from "@/lib/config/modules"

export async function updateEnabledModules(modules: ModuleKey[]) {
  // Validate all keys are real module keys
  const valid = modules.every((k) => ALL_MODULE_KEYS.includes(k))
  if (!valid) return { error: "Invalid module key" }

  const { supabase, ctx } = await requirePermission("modules:toggle")
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
