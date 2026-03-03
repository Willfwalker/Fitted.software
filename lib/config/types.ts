// ============================================
// Core types for the config-driven system
// ============================================

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "phone"
  | "url"
  | "select"
  | "multi_select"
  | "date"
  | "datetime"
  | "checkbox"
  | "currency"
  | "rating"
  | "relation";

export interface Entity {
  id: string;
  org_id: string;
  name: string;
  display_name: string;
  slug: string;
  icon: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
}

export interface EntityField {
  id: string;
  entity_id: string;
  name: string;
  display_name: string;
  field_type: FieldType;
  options: Record<string, unknown>;
  is_required: boolean;
  is_system: boolean;
  sort_order: number;
  created_at: string;
}

export interface EntityRecord {
  id: string;
  org_id: string;
  entity_id: string;
  data: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ViewType = "table" | "board" | "calendar" | "gallery";

export interface View {
  id: string;
  org_id: string;
  entity_id: string;
  name: string;
  view_type: ViewType;
  config: ViewConfig;
  is_default: boolean;
  sort_order: number;
  created_at: string;
}

export interface ViewConfig {
  columns?: string[];
  sort?: { field: string; direction: "asc" | "desc" };
  filters?: ViewFilter[];
  group_by?: string;
  card_fields?: string[];
}

export interface ViewFilter {
  field: string;
  operator: "eq" | "neq" | "contains" | "gt" | "lt";
  value: string;
}

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetConfig {
  id: string;
  type: string;
  props: Record<string, unknown>;
  position: WidgetPosition;
}

export interface Page {
  id: string;
  org_id: string;
  slug: string;
  title: string;
  layout: WidgetConfig[];
  created_at: string;
  updated_at: string;
}

export interface Theme {
  id: string;
  org_id: string;
  variables: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}
