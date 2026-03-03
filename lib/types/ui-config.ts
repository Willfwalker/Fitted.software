export type CustomFieldType =
  | "text"
  | "email"
  | "phone"
  | "number"
  | "date"
  | "select"
  | "textarea"
  | "url"
  | "checkbox"

export type EntityType = "contacts" | "companies" | "deals" | "invoices" | "reports" | "dashboard"

export interface CustomFieldOption {
  label: string
  value: string
}

export interface CustomFieldDef {
  key: string
  label: string
  type: CustomFieldType
  required?: boolean
  placeholder?: string
  options?: CustomFieldOption[]
}

export interface FilterDef {
  key: string
  label: string
  type: "select" | "text" | "date-range" | "boolean"
  column: string
  options?: CustomFieldOption[]
}

export interface ColumnDef {
  key: string
  label: string
  source: "field" | "metadata"
  column: string
  visible: boolean
}

export interface SortDef {
  key: string
  label: string
  column: string
  ascending: boolean
  castType?: "text" | "number" | "date"
}

export interface UiConfig {
  fields: CustomFieldDef[]
  filters?: FilterDef[]
  columns?: ColumnDef[]
  sorts?: SortDef[]
}

export const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: "contacts", label: "Contacts" },
  { value: "companies", label: "Companies" },
  { value: "deals", label: "Deals" },
  { value: "invoices", label: "Invoices" },
  { value: "reports", label: "Reports" },
  { value: "dashboard", label: "Dashboard" },
]
