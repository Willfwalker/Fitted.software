import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { runProvisioning } from "@/lib/provisioning/orchestrator"

export async function POST(request: Request) {
  // Verify auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { businessName, contactEmail, accentColor, customDomain, modules } = body

  if (!businessName || !contactEmail || !modules?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // Generate slug from business name
  const slug = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  // Check for duplicate slug
  const { createClient: createSB } = require("@supabase/supabase-js")
  const adminDb = createSB(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: existing } = await adminDb
    .from("provisioned_clients")
    .select("id")
    .eq("slug", slug)
    .single()

  if (existing) {
    return NextResponse.json({ error: "A client with this name already exists" }, { status: 409 })
  }

  // Start provisioning in the background (don't await)
  runProvisioning({
    slug,
    businessName,
    contactEmail,
    accentColor: accentColor || "#D4734E",
    customDomain,
    modules,
  }).catch((err) => {
    console.error("Provisioning error:", err)
  })

  return NextResponse.json({ slug, status: "provisioning" })
}
