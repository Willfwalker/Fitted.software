import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { slug } = await params
  const adminDb = createServiceClient()

  // Only allow deleting failed or rolled_back clients
  const { data: client } = await adminDb
    .from("provisioned_clients")
    .select("id, status")
    .eq("slug", slug)
    .single()

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 })
  }

  if (client.status !== "failed" && client.status !== "rolled_back") {
    return NextResponse.json(
      { error: "Only failed or rolled-back clients can be deleted" },
      { status: 400 }
    )
  }

  const { error } = await adminDb
    .from("provisioned_clients")
    .delete()
    .eq("id", client.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
