import type { z } from "zod"
import type { ComponentType } from "react"
import type {
  StatCardConfigSchema,
  DataTableConfigSchema,
  ChartAreaConfigSchema,
  ChartBarConfigSchema,
  ChartPieConfigSchema,
  KanbanConfigSchema,
  ActivityFeedConfigSchema,
  ListConfigSchema,
  TextConfigSchema,
  FormConfigSchema,
  QuickActionsConfigSchema,
  MetricRowConfigSchema,
  TeamListConfigSchema,
  CalendarConfigSchema,
  EmbedConfigSchema,
} from "./schemas"

// All allowed data sources (CRM tables the blocks can query)
export const DATA_SOURCES = [
  "contacts",
  "companies",
  "deals",
  "activities",
  "invoices",
  "tags",
] as const

export type DataSource = (typeof DATA_SOURCES)[number]

// Block type identifiers
export const BLOCK_TYPES = [
  "stat-card",
  "data-table",
  "chart-area",
  "chart-bar",
  "chart-pie",
  "kanban",
  "activity-feed",
  "list",
  "text",
  "form",
  "quick-actions",
  "metric-row",
  "team-list",
  "calendar",
  "embed",
] as const

export type BlockType = (typeof BLOCK_TYPES)[number]

// Config types inferred from Zod schemas
export type StatCardConfig = z.infer<typeof StatCardConfigSchema>
export type DataTableConfig = z.infer<typeof DataTableConfigSchema>
export type ChartAreaConfig = z.infer<typeof ChartAreaConfigSchema>
export type ChartBarConfig = z.infer<typeof ChartBarConfigSchema>
export type ChartPieConfig = z.infer<typeof ChartPieConfigSchema>
export type KanbanConfig = z.infer<typeof KanbanConfigSchema>
export type ActivityFeedConfig = z.infer<typeof ActivityFeedConfigSchema>
export type ListConfig = z.infer<typeof ListConfigSchema>
export type TextConfig = z.infer<typeof TextConfigSchema>
export type FormConfig = z.infer<typeof FormConfigSchema>
export type QuickActionsConfig = z.infer<typeof QuickActionsConfigSchema>
export type MetricRowConfig = z.infer<typeof MetricRowConfigSchema>
export type TeamListConfig = z.infer<typeof TeamListConfigSchema>
export type CalendarConfig = z.infer<typeof CalendarConfigSchema>
export type EmbedConfig = z.infer<typeof EmbedConfigSchema>

export type BlockConfig =
  | StatCardConfig
  | DataTableConfig
  | ChartAreaConfig
  | ChartBarConfig
  | ChartPieConfig
  | KanbanConfig
  | ActivityFeedConfig
  | ListConfig
  | TextConfig
  | FormConfig
  | QuickActionsConfig
  | MetricRowConfig
  | TeamListConfig
  | CalendarConfig
  | EmbedConfig

// Props every block component receives
export interface BlockProps<T = Record<string, unknown>> {
  config: T
  orgId: string
  blockId: string
}

// Database row types
export interface WorkspacePage {
  id: string
  org_id: string
  slug: string
  title: string
  icon: string
  description: string | null
  layout: { columns: number; gap: number }
  sort_order: number
  is_default: boolean
  is_pinned: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface WorkspaceBlock {
  id: string
  page_id: string
  org_id: string
  block_type: BlockType
  config: Record<string, unknown>
  position: number
  col_span: number
  created_by: string | null
  created_at: string
  updated_at: string
}

// Registry entry
export interface BlockRegistryEntry {
  component: ComponentType<BlockProps<any>>
  label: string
  description: string
  defaultColSpan: number
  icon: string
}
