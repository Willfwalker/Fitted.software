import { z } from "zod"

export const messageTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(200),
  subject: z.string().max(500).optional().or(z.literal("")),
  body: z.string().min(1, "Template body is required").max(50000),
  channel: z.enum(["EMAIL", "SMS"]).default("EMAIL"),
  variables: z.array(z.string()).optional().default([]),
})

export const composeMessageSchema = z.object({
  subject: z.string().max(500).optional().or(z.literal("")),
  body: z.string().min(1, "Message body is required").max(50000),
  recipient_email: z.string().email("Valid email is required"),
  recipient_name: z.string().max(200).optional().or(z.literal("")),
  contact_id: z.string().uuid().optional().or(z.literal("")),
  company_id: z.string().uuid().optional().or(z.literal("")),
  deal_id: z.string().uuid().optional().or(z.literal("")),
  template_id: z.string().uuid().optional().or(z.literal("")),
})

export type MessageTemplateFormData = z.infer<typeof messageTemplateSchema>
export type ComposeMessageFormData = z.infer<typeof composeMessageSchema>
