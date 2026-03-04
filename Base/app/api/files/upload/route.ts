import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
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

  const orgId = membership.org_id

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const folder = (formData.get("folder") as string) || "/"

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  // 50MB limit
  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 })
  }

  const fileId = crypto.randomUUID()
  const ext = file.name.includes(".") ? file.name.split(".").pop() : ""
  const storagePath = `${orgId}${folder === "/" ? "/" : `/${folder.replace(/^\/|\/$/g, "")}/`}${fileId}${ext ? `.${ext}` : ""}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from("org-files")
    .upload(storagePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Insert file metadata
  const { data: fileRecord, error: insertError } = await supabase
    .from("files")
    .insert({
      id: fileId,
      org_id: orgId,
      name: file.name,
      original_name: file.name,
      mime_type: file.type || "application/octet-stream",
      size_bytes: file.size,
      storage_path: storagePath,
      folder,
      created_by: user.id,
    })
    .select()
    .single()

  if (insertError) {
    // Clean up uploaded file on metadata insert failure
    await supabase.storage.from("org-files").remove([storagePath])
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Log activity
  await supabase.from("activities").insert({
    org_id: orgId,
    type: "FILE_UPLOADED",
    title: `Uploaded ${file.name}`,
    metadata: { file_id: fileId, mime_type: file.type, size_bytes: file.size },
    created_by: user.id,
  })

  return NextResponse.json({ data: fileRecord })
}
