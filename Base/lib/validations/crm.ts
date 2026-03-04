import { z } from "zod"

export const contactSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email").max(255).optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  title: z.string().max(100).optional().or(z.literal("")),
  company_id: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().max(5000).optional().or(z.literal("")),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const companySchema = z.object({
  name: z.string().min(1, "Company name is required").max(200),
  domain: z.string().max(255).optional().or(z.literal("")),
  industry: z.string().max(100).optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  email: z.string().email("Invalid email").max(255).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  notes: z.string().max(5000).optional().or(z.literal("")),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const dealSchema = z.object({
  title: z.string().min(1, "Deal title is required").max(200),
  value: z.coerce.number().min(0).optional(),
  stage: z.enum(["LEAD", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  contact_id: z.string().uuid().optional().or(z.literal("")),
  company_id: z.string().uuid().optional().or(z.literal("")),
  expected_close_date: z.string().optional().or(z.literal("")),
  notes: z.string().max(5000).optional().or(z.literal("")),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const noteSchema = z.object({
  type: z.enum(["NOTE", "EMAIL", "CALL", "MEETING"]),
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().max(10000).optional().or(z.literal("")),
})

export const invoiceLineItemSchema = z.object({
  description: z.string().min(1, "Description is required").max(500),
  quantity: z.coerce.number().min(0.01, "Quantity must be positive"),
  rate: z.coerce.number().min(0, "Rate must be non-negative"),
  amount: z.coerce.number().min(0),
})

export const invoiceSchema = z.object({
  items: z.array(invoiceLineItemSchema).min(1, "At least one line item is required"),
  subtotal: z.coerce.number().min(0),
  tax_rate: z.coerce.number().min(0).max(100).default(0),
  tax_amount: z.coerce.number().min(0).default(0),
  total: z.coerce.number().min(0),
  issue_date: z.string().min(1, "Issue date is required"),
  due_date: z.string().optional().or(z.literal("")),
  discount_type: z.enum(["percentage", "flat"]).nullable().default(null),
  discount_value: z.coerce.number().min(0).default(0),
  payment_terms: z.string().default("DUE_ON_RECEIPT"),
  currency: z.string().min(1).default("USD"),
  contact_id: z.string().uuid().optional().or(z.literal("")),
  company_id: z.string().uuid().optional().or(z.literal("")),
  deal_id: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().max(5000).optional().or(z.literal("")),
})

export const tagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
})

export const sendInvoiceEmailSchema = z.object({
  invoiceId: z.string().uuid(),
  recipientEmail: z.string().email("Valid email is required"),
  recipientName: z.string().max(200).optional().or(z.literal("")),
  message: z.string().max(5000).optional().or(z.literal("")),
})

export const recurringInvoiceSchema = z.object({
  source_invoice_id: z.string().uuid(),
  frequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional().or(z.literal("")),
  max_runs: z.coerce.number().int().min(1).optional(),
})

export type ContactFormData = z.infer<typeof contactSchema>
export type CompanyFormData = z.infer<typeof companySchema>
export type DealFormData = z.infer<typeof dealSchema>
export type NoteFormData = z.infer<typeof noteSchema>
export type InvoiceFormData = z.infer<typeof invoiceSchema>
export type TagFormData = z.infer<typeof tagSchema>
export type SendInvoiceEmailFormData = z.infer<typeof sendInvoiceEmailSchema>
export type RecurringInvoiceFormData = z.infer<typeof recurringInvoiceSchema>
