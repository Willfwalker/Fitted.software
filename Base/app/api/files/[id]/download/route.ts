import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .single()

  if (!membership) {
    return NextResponse.json({ error: "No organization" }, { status: 403 })
  }

  const { data: file } = await supabase
    .from("files")
    .select("storage_path, original_name")
    .eq("id", id)
    .eq("org_id", membership.org_id)
    .single()

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  const { data, error } = await supabase.storage
    .from("org-files")
    .createSignedUrl(file.storage_path, 3600, {
      download: file.original_name,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.redirect(data.signedUrl)
}
