import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Inbound email webhook handler (Resend Inbound).
 * Receives parsed email data and creates an INBOUND message record.
 */
export async function POST(request: NextRequest) {
  const data = await request.json()

  const {
    from,
    to,
    subject,
    text,
    html,
    headers,
  } = data as {
    from: string
    to: string | string[]
    subject: string
    text: string
    html: string
    headers: Record<string, string>
  }

  const senderEmail = from?.replace(/<|>/g, "").split(" ").pop() || from
  const inReplyTo = headers?.["in-reply-to"] || headers?.["In-Reply-To"] || null
  const messageId = headers?.["message-id"] || headers?.["Message-ID"] || null

  const supabase = getAdminClient()

  // Determine recipient org from the "to" address
  // Format: messages@{org-slug}.{resend-inbound-domain}
  const toAddress = Array.isArray(to) ? to[0] : to
  const inboundDomain = process.env.RESEND_INBOUND_DOMAIN || ""

  // For now, try to find the org by matching contacts with the sender email
  const { data: contactMatch } = await supabase
    .from("contacts")
    .select("id, org_id, first_name, last_name, company_id")
    .eq("email", senderEmail)
    .limit(1)
    .maybeSingle()

  if (!contactMatch) {
    // Unknown sender — still store but without linking
    // Could implement a bounce-back or ignore strategy
    return NextResponse.json({ received: true, linked: false })
  }

  const orgId = contactMatch.org_id

  // Thread matching: find existing message by In-Reply-To header
  let threadId: string | null = null
  if (inReplyTo) {
    const { data: parentMsg } = await supabase
      .from("messages")
      .select("id, thread_id")
      .eq("message_id_header", inReplyTo)
      .eq("org_id", orgId)
      .limit(1)
      .maybeSingle()

    if (parentMsg) {
      threadId = parentMsg.thread_id || parentMsg.id
    }
  }

  // Get a system user (first org admin) for created_by
  const { data: admin } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("org_id", orgId)
    .eq("role", "OWNER")
    .limit(1)
    .maybeSingle()

  const createdBy = admin?.user_id || "00000000-0000-0000-0000-000000000000"

  // Create inbound message record
  const { data: message, error: insertError } = await supabase
    .from("messages")
    .insert({
      org_id: orgId,
      channel: "EMAIL",
      status: "DELIVERED",
      subject: subject || null,
      body: text || html || "",
      recipient_email: toAddress,
      recipient_name: null,
      contact_id: contactMatch.id,
      company_id: contactMatch.company_id || null,
      direction: "INBOUND",
      thread_id: threadId,
      in_reply_to: inReplyTo,
      message_id_header: messageId,
      sent_at: new Date().toISOString(),
      created_by: createdBy,
    })
    .select("id")
    .single()

  if (insertError) {
    console.error("Failed to store inbound email:", insertError)
    return NextResponse.json({ error: "Storage failed" }, { status: 500 })
  }

  // Log EMAIL_RECEIVED activity
  await supabase.from("activities").insert({
    org_id: orgId,
    contact_id: contactMatch.id,
    company_id: contactMatch.company_id || null,
    type: "EMAIL_RECEIVED",
    title: `Email received from ${contactMatch.first_name} ${contactMatch.last_name}`,
    metadata: { message_id: message.id, subject, sender: senderEmail },
    created_by: createdBy,
  })

  // Create notification for org
  await supabase.from("notifications").insert({
    org_id: orgId,
    user_id: createdBy,
    title: `Email from ${contactMatch.first_name} ${contactMatch.last_name}`,
    body: subject || "New email received",
    link: "/messages",
    icon: "MailOpen",
    source_type: "message",
    source_id: message.id,
  })

  return NextResponse.json({ received: true, linked: true, messageId: message.id })
}
