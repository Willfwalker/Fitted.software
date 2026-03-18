"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "./helpers"
import { composeMessageSchema } from "@/lib/validations/messaging"
import { notifyOrgMembers } from "./notifications"
import { Resend } from "resend"
import type { Message, MessageStatus } from "@/lib/types/messaging"

const resend = new Resend(process.env.RESEND_API_KEY)

export type MessageActionState = {
  error?: string
  success?: boolean
  messageId?: string
}

export async function sendMessage(
  data: {
    subject?: string
    body: string
    recipient_email: string
    recipient_name?: string
    contact_id?: string
    company_id?: string
    deal_id?: string
    template_id?: string
  }
): Promise<MessageActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const parsed = composeMessageSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const d = parsed.data
  const supabase = await createClient()

  // Get org name for email from address
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", ctx.orgId)
    .single()

  const orgName = org?.name ?? "Company"
  const resendDomain = process.env.RESEND_DOMAIN || "resend.dev"

  // Generate a message ID header for threading
  const messageIdHeader = `<${crypto.randomUUID()}@${resendDomain}>`

  // Insert message record as SENT (optimistic)
  const { data: message, error: insertError } = await supabase
    .from("messages")
    .insert({
      org_id: ctx.orgId,
      channel: "EMAIL" as const,
      status: "SENT" as MessageStatus,
      subject: d.subject || null,
      body: d.body,
      recipient_email: d.recipient_email,
      recipient_name: d.recipient_name || null,
      contact_id: d.contact_id || null,
      company_id: d.company_id || null,
      deal_id: d.deal_id || null,
      template_id: d.template_id || null,
      direction: "OUTBOUND",
      message_id_header: messageIdHeader,
      sent_at: new Date().toISOString(),
      created_by: ctx.userId,
    })
    .select("id")
    .single()

  if (insertError) return { error: insertError.message }

  // Send email via Resend
  const { error: sendError } = await resend.emails.send({
    from: `${orgName} <messages@${resendDomain}>`,
    to: d.recipient_email,
    subject: d.subject || `Message from ${orgName}`,
    html: buildMessageEmailHtml({
      orgName,
      recipientName: d.recipient_name || undefined,
      subject: d.subject || undefined,
      body: d.body,
    }),
  })

  if (sendError) {
    // Update message status to FAILED
    await supabase
      .from("messages")
      .update({ status: "FAILED" as MessageStatus, error_message: sendError.message, sent_at: null })
      .eq("id", message.id)
      .eq("org_id", ctx.orgId)

    return { error: sendError.message }
  }

  // Update to DELIVERED
  await supabase
    .from("messages")
    .update({ status: "DELIVERED" as MessageStatus })
    .eq("id", message.id)
    .eq("org_id", ctx.orgId)

  // Log activity
  await supabase.from("activities").insert({
    org_id: ctx.orgId,
    contact_id: d.contact_id || null,
    company_id: d.company_id || null,
    deal_id: d.deal_id || null,
    type: "MESSAGE_SENT",
    title: `Sent email to ${d.recipient_name || d.recipient_email}`,
    metadata: { message_id: message.id, recipient: d.recipient_email },
    created_by: ctx.userId,
  })

  // Notify org members of delivery
  await notifyOrgMembers({
    orgId: ctx.orgId,
    performerUserId: ctx.userId,
    category: "message",
    title: "Message delivered",
    body: `Email to ${d.recipient_name || d.recipient_email} was delivered`,
    link: "/messages",
    icon: "Mail",
    sourceType: "message",
    sourceId: message.id,
  })

  revalidatePath("/messages")
  return { success: true, messageId: message.id }
}

export async function replyToMessage(
  parentId: string,
  data: {
    body: string
    subject?: string
  }
): Promise<MessageActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  // Fetch parent message
  const { data: parent } = await supabase
    .from("messages")
    .select("id, thread_id, recipient_email, recipient_name, contact_id, company_id, deal_id, subject, message_id_header, direction")
    .eq("id", parentId)
    .eq("org_id", ctx.orgId)
    .single()

  if (!parent) return { error: "Parent message not found" }

  // Determine thread root
  const threadId = parent.thread_id || parent.id

  // Get org name
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", ctx.orgId)
    .single()

  const orgName = org?.name ?? "Company"
  const resendDomain = process.env.RESEND_DOMAIN || "resend.dev"
  const messageIdHeader = `<${crypto.randomUUID()}@${resendDomain}>`

  // Build reply subject
  const replySubject = data.subject || (parent.subject ? `Re: ${parent.subject.replace(/^Re:\s*/i, "")}` : `Reply from ${orgName}`)

  // Insert reply
  const { data: message, error: insertError } = await supabase
    .from("messages")
    .insert({
      org_id: ctx.orgId,
      channel: "EMAIL" as const,
      status: "SENT" as MessageStatus,
      subject: replySubject,
      body: data.body,
      recipient_email: parent.recipient_email,
      recipient_name: parent.recipient_name,
      contact_id: parent.contact_id,
      company_id: parent.company_id,
      deal_id: parent.deal_id,
      thread_id: threadId,
      direction: "OUTBOUND",
      in_reply_to: parent.message_id_header,
      message_id_header: messageIdHeader,
      sent_at: new Date().toISOString(),
      created_by: ctx.userId,
    })
    .select("id")
    .single()

  if (insertError) return { error: insertError.message }

  // Send email via Resend
  const headers: Record<string, string> = {}
  if (parent.message_id_header) {
    headers["In-Reply-To"] = parent.message_id_header
    headers["References"] = parent.message_id_header
  }

  const { error: sendError } = await resend.emails.send({
    from: `${orgName} <messages@${resendDomain}>`,
    to: parent.recipient_email!,
    subject: replySubject,
    html: buildMessageEmailHtml({
      orgName,
      recipientName: parent.recipient_name || undefined,
      subject: replySubject,
      body: data.body,
    }),
    headers,
  })

  if (sendError) {
    await supabase
      .from("messages")
      .update({ status: "FAILED" as MessageStatus, error_message: sendError.message, sent_at: null })
      .eq("id", message.id)
      .eq("org_id", ctx.orgId)
    return { error: sendError.message }
  }

  // Update to DELIVERED
  await supabase
    .from("messages")
    .update({ status: "DELIVERED" as MessageStatus })
    .eq("id", message.id)
    .eq("org_id", ctx.orgId)

  // Log activity
  await supabase.from("activities").insert({
    org_id: ctx.orgId,
    contact_id: parent.contact_id,
    company_id: parent.company_id,
    deal_id: parent.deal_id,
    type: "MESSAGE_SENT",
    title: `Replied to ${parent.recipient_name || parent.recipient_email}`,
    metadata: { message_id: message.id, thread_id: threadId },
    created_by: ctx.userId,
  })

  revalidatePath("/messages")
  return { success: true, messageId: message.id }
}

export async function getMessageThread(
  threadId: string
): Promise<{ data: Message[]; error?: string }> {
  const ctx = await getOrgId()
  if (!ctx) return { data: [], error: "Not authenticated" }

  const supabase = await createClient()

  // Get the root message + all replies in the thread
  const { data, error } = await supabase
    .from("messages")
    .select("*, contact:contacts(id, first_name, last_name, email), company:companies(id, name), deal:deals(id, title)")
    .eq("org_id", ctx.orgId)
    .or(`id.eq.${threadId},thread_id.eq.${threadId}`)
    .order("created_at", { ascending: true })

  if (error) return { data: [], error: error.message }

  return { data: (data ?? []) as Message[] }
}

export async function deleteMessage(id: string): Promise<MessageActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/messages")
  return { success: true }
}

export async function getMessageHistory(
  limit: number = 50,
  offset: number = 0
): Promise<{ data: Message[]; error?: string }> {
  const ctx = await getOrgId()
  if (!ctx) return { data: [], error: "Not authenticated" }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("messages")
    .select("*, contact:contacts(id, first_name, last_name, email), company:companies(id, name), deal:deals(id, title), template:message_templates(id, name)")
    .eq("org_id", ctx.orgId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return { data: [], error: error.message }

  return { data: (data ?? []) as Message[] }
}

// Simple email HTML builder for generic messages
function buildMessageEmailHtml(data: {
  orgName: string
  recipientName?: string
  subject?: string
  body: string
}): string {
  const greeting = data.recipientName ? `Hi ${data.recipientName},` : "Hello,"
  const bodyHtml = escapeHtml(data.body)

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#0B0B0B;padding:28px 36px;">
          <span style="font-size:20px;font-weight:700;color:#E8E0D4;letter-spacing:-0.02em;">${escapeHtml(data.orgName)}</span>
        </td></tr>
        <tr><td style="padding:36px;">
          <p style="margin:0 0 16px;font-size:15px;color:#333;line-height:1.6;">${greeting}</p>
          <div style="margin:0 0 24px;font-size:15px;color:#333;line-height:1.6;">${bodyHtml}</div>
        </td></tr>
        <tr><td style="padding:20px 36px;border-top:1px solid #eee;">
          <p style="margin:0;font-size:12px;color:#999;text-align:center;">
            Sent via ${escapeHtml(data.orgName)}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>")
}
