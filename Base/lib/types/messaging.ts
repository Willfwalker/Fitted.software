// ============================================
// Messaging & Templates Type Definitions
// ============================================

import type { Contact, Company, Deal } from "./crm"

export type MessageChannel = "EMAIL" | "SMS"
export type MessageStatus = "DRAFT" | "SENT" | "DELIVERED" | "FAILED"

export interface MessageTemplate {
  id: string
  org_id: string
  name: string
  subject: string | null
  body: string
  channel: MessageChannel
  variables: string[]
  created_by: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  org_id: string
  channel: MessageChannel
  status: MessageStatus
  subject: string | null
  body: string
  recipient_email: string | null
  recipient_name: string | null
  contact_id: string | null
  company_id: string | null
  deal_id: string | null
  template_id: string | null
  sent_at: string | null
  error_message: string | null
  metadata: Record<string, unknown> | null
  created_by: string
  created_at: string
  updated_at: string
  // Joined
  contact?: Pick<Contact, "id" | "first_name" | "last_name" | "email"> | null
  company?: Pick<Company, "id" | "name"> | null
  deal?: Pick<Deal, "id" | "title"> | null
  template?: Pick<MessageTemplate, "id" | "name"> | null
}

export const MESSAGE_CHANNELS: { value: MessageChannel; label: string }[] = [
  { value: "EMAIL", label: "Email" },
  { value: "SMS", label: "SMS" },
]

export const MESSAGE_STATUSES: { value: MessageStatus; label: string; color: string }[] = [
  { value: "DRAFT", label: "Draft", color: "#8A817A" },
  { value: "SENT", label: "Sent", color: "#5B8DEF" },
  { value: "DELIVERED", label: "Delivered", color: "#5EC69A" },
  { value: "FAILED", label: "Failed", color: "#EF5B5B" },
]

/**
 * Render a template by substituting {{variable}} placeholders with provided values.
 * Pure function — safe to import from both client and server.
 */
export function renderTemplate(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return values[key] ?? match
  })
}
