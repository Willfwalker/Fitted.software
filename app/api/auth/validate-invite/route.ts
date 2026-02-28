import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { code } = await request.json()

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { valid: false, error: "Invite code is required" },
        { status: 400 }
      )
    }

    const normalized = code.trim().toUpperCase()
    const supabase = await createClient()

    const { data: invite, error } = await supabase
      .from("invite_codes")
      .select("id, expires_at, max_uses, use_count")
      .eq("code", normalized)
      .single()

    if (error || !invite) {
      return NextResponse.json(
        { valid: false, error: "Invalid invite code" },
        { status: 404 }
      )
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, error: "This invite code has expired" },
        { status: 410 }
      )
    }

    if (invite.use_count >= invite.max_uses) {
      return NextResponse.json(
        { valid: false, error: "This invite code has reached its usage limit" },
        { status: 410 }
      )
    }

    return NextResponse.json({ valid: true })
  } catch {
    return NextResponse.json(
      { valid: false, error: "Something went wrong" },
      { status: 500 }
    )
  }
}
