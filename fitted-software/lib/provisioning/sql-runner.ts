/**
 * Run SQL against a Supabase project using the Management API.
 * Tolerates "already exists" errors to make schema files idempotent.
 */
export async function runSQL(
  ref: string,
  accessToken: string,
  sql: string
): Promise<void> {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  })

  if (!res.ok) {
    const body = await res.text()
    // Skip "already exists" errors — these schemas are incremental
    if (body.includes("already exists")) {
      console.log(`     ⚠ Skipped (already exists)`)
      return
    }
    throw new Error(`SQL execution failed: ${body}`)
  }
}
