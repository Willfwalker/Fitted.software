import { createClient } from "@supabase/supabase-js"
import { config as loadEnv } from "dotenv"
loadEnv({ path: ".env.local" })

async function main() {
  const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data, error } = await s
    .from("provisioned_clients")
    .select(
      "slug,business_name,status,github_repo,supabase_ref,vercel_project_id,created_at"
    )
    .order("created_at")
  if (error) {
    console.error(error.message)
    process.exit(1)
  }
  console.log(`Found ${data?.length ?? 0} client(s):\n`)
  for (const c of data ?? []) {
    console.log(`  ${c.slug} [${c.status}] — ${c.business_name}`)
    console.log(`    github:   ${c.github_repo ?? "-"}`)
    console.log(`    supabase: ${c.supabase_ref ?? "-"}`)
    console.log(`    vercel:   ${c.vercel_project_id ?? "-"}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
