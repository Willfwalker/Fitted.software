// ============================================
// Forms & Data Capture Type Definitions
// ============================================

import type { Contact, Company, Deal } from "./crm"

export type FormStatus = "DRAFT" | "ACTIVE" | "ARCHIVED"
export type FormFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "EMAIL"
  | "PHONE"
  | "NUMBER"
  | "DATE"
  | "SELECT"
  | "MULTI_SELECT"
  | "CHECKBOX"
  | "RADIO"
  | "FILE"
  | "HIDDEN"

export interface FormField {
  id: string
  type: FormFieldType
  label: string
  placeholder?: string
  required?: boolean
  options?: string[]
  default_value?: string
}

export interface Form {
  id: string
  org_id: string
  name: string
  description: string | null
  slug: string | null
  status: FormStatus
  fields: FormField[]
  settings: Record<string, unknown>
  share_token: string | null
  submission_count: number
  created_by: string
  created_at: string
  updated_at: string
  metadata: Record<string, unknown> | null
}

export interface FormSubmission {
  id: string
  org_id: string
  form_id: string
  data: Record<string, unknown>
  contact_id: string | null
  company_id: string | null
  deal_id: string | null
  source_ip: string | null
  user_agent: string | null
  created_at: string
  metadata: Record<string, unknown> | null
  // Joined
  form?: Pick<Form, "id" | "name" | "fields"> | null
  contact?: Pick<Contact, "id" | "first_name" | "last_name" | "email"> | null
  company?: Pick<Company, "id" | "name"> | null
  deal?: Pick<Deal, "id" | "title"> | null
}

export const FORM_STATUSES: { value: FormStatus; label: string; color: string }[] = [
  { value: "DRAFT", label: "Draft", color: "#8A817A" },
  { value: "ACTIVE", label: "Active", color: "#5EC69A" },
  { value: "ARCHIVED", label: "Archived", color: "#E8A84C" },
]

export const FORM_FIELD_TYPES: { value: FormFieldType; label: string; icon: string }[] = [
  { value: "TEXT", label: "Short Text", icon: "Type" },
  { value: "TEXTAREA", label: "Long Text", icon: "AlignLeft" },
  { value: "EMAIL", label: "Email", icon: "Mail" },
  { value: "PHONE", label: "Phone", icon: "Phone" },
  { value: "NUMBER", label: "Number", icon: "Hash" },
  { value: "DATE", label: "Date", icon: "Calendar" },
  { value: "SELECT", label: "Dropdown", icon: "ChevronDown" },
  { value: "MULTI_SELECT", label: "Multi Select", icon: "ListChecks" },
  { value: "CHECKBOX", label: "Checkbox", icon: "CheckSquare" },
  { value: "RADIO", label: "Radio", icon: "CircleDot" },
  { value: "FILE", label: "File Upload", icon: "Paperclip" },
  { value: "HIDDEN", label: "Hidden", icon: "EyeOff" },
]
