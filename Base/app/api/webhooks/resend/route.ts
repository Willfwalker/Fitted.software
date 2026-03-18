import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function verifySignature(body: string, signature: string | null): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret || !signature) return false
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex")
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("resend-signature")

  // Verify webhook signature if secret is configured
  if (process.env.RESEND_WEBHOOK_SECRET && !verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let payload: { type: string; data: Record<string, unknown> }
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const supabase = getAdminClient()
  const emailId = payload.data?.email_id as string | undefined

  if (!emailId) {
    return NextResponse.json({ received: true })
  }

  switch (payload.type) {
    case "email.delivered": {
      await supabase
        .from("messages")
        .update({ status: "DELIVERED" })
        .eq("resend_email_id", emailId)
      break
    }
    case "email.bounced": {
      await supabase
        .from("messages")
        .update({
          status: "FAILED",
          error_message: "Email bounced",
        })
        .eq("resend_email_id", emailId)
      break
    }
    case "email.opened": {
      // Store open event in metadata
      await supabase
        .from("messages")
        .update({
          metadata: { opened_at: new Date().toISOString() },
        })
        .eq("resend_email_id", emailId)
      break
    }
  }

  return NextResponse.json({ received: true })
}
