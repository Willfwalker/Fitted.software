import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "@/lib/actions/helpers"

export async function GET(request: NextRequest) {
  const entityType = request.nextUrl.searchParams.get("entityType")
  if (!entityType) {
    return NextResponse.json({ error: "Missing entityType" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const ctx = await getOrgId()
  if (!ctx) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { data } = await supabase
    .from("ui_configs")
    .select("config")
    .eq("org_id", ctx.orgId)
    .eq("entity_type", entityType)
    .single()

  return NextResponse.json({ config: data?.config ?? { fields: [] } })
}
