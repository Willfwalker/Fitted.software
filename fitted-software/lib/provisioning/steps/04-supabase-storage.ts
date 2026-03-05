import { createClient } from "@supabase/supabase-js"
import type { ProvisionContext } from "../types"

export async function stepSupabaseStorage(ctx: ProvisionContext): Promise<Partial<ProvisionContext>> {
  const client = createClient(ctx.supabaseUrl!, ctx.supabaseServiceKey!)

  const { error } = await client.storage.createBucket("org-files", {
    public: false,
    fileSizeLimit: 52428800, // 50MB
    allowedMimeTypes: [
      "image/*",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.*",
      "text/*",
    ],
  })

  if (error && !error.message.includes("already exists")) {
    throw new Error(`Storage bucket creation failed: ${error.message}`)
  }

  return {}
}
