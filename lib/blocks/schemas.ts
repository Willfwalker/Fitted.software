import { z } from "zod"

const DataSourceEnum = z.enum([
  "contacts",
  "companies",
  "deals",
  "activities",
  "invoices",
  "tags",
])

const FilterSchema = z.record(z.string(), z.unknown()).optional()

// stat-card
export const StatCardConfigSchema = z.object({
  title: z.string(),
  data_source: DataSourceEnum,
  aggregate: z.enum(["count", "sum", "avg"]).default("count"),
  aggregate_field: z.string().optional(),
  filter: FilterSchema,
  icon: z.string().optional(),
  format: z.enum(["number", "currency", "percent"]).default("number"),
  subtitle: z.string().optional(),
  subtitle_source: DataSourceEnum.optional(),
  subtitle_aggregate: z.enum(["count", "sum", "avg"]).optional(),
  subtitle_field: z.string().optional(),
  subtitle_filter: FilterSchema,
  subtitle_template: z.string().optional(),
})

// data-table
export const DataTableConfigSchema = z.object({
  title: z.string().optional(),
  data_source: DataSourceEnum,
  columns: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        sortable: z.boolean().default(false),
      })
    )
    .default([]),
  filters: FilterSchema,
  page_size: z.number().default(10),
  show_search: z.boolean().default(true),
})

// chart-area
export const ChartAreaConfigSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  data_source: DataSourceEnum,
  x_field: z.string(),
  y_field: z.string(),
  y_aggregate: z.enum(["count", "sum", "avg"]).default("sum"),
  filter: FilterSchema,
  time_bucket: z.enum(["day", "week", "month"]).optional(),
  time_range: z.number().optional(),
})

// chart-bar
export const ChartBarConfigSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  data_source: DataSourceEnum,
  x_field: z.string(),
  y_field: z.string(),
  y_aggregate: z.enum(["count", "sum", "avg"]).default("sum"),
  filter: FilterSchema,
})

// chart-pie
export const ChartPieConfigSchema = z.object({
  title: z.string().optional(),
  data_source: DataSourceEnum,
  group_field: z.string(),
  value_field: z.string().optional(),
  value_aggregate: z.enum(["count", "sum"]).default("count"),
  filter: FilterSchema,
})

// kanban
export const KanbanConfigSchema = z.object({
  title: z.string().optional(),
  data_source: DataSourceEnum,
  stage_field: z.string(),
  card_title_field: z.string(),
  card_subtitle_field: z.string().optional(),
  card_value_field: z.string().optional(),
  filter: FilterSchema,
})

// activity-feed
export const ActivityFeedConfigSchema = z.object({
  title: z.string().default("Recent Activity"),
  limit: z.number().default(8),
  filter: FilterSchema,
})

// list
export const ListConfigSchema = z.object({
  title: z.string().optional(),
  data_source: DataSourceEnum,
  display_field: z.string(),
  secondary_field: z.string().optional(),
  limit: z.number().default(10),
  filter: FilterSchema,
  link_template: z.string().optional(),
})

// text
export const TextConfigSchema = z.object({
  content: z.string().default(""),
  format: z.enum(["plain", "markdown"]).default("plain"),
  title: z.string().optional(),
})

// form
export const FormConfigSchema = z.object({
  title: z.string().optional(),
  data_source: DataSourceEnum,
  fields: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        type: z
          .enum(["text", "number", "email", "textarea", "select", "date"])
          .default("text"),
        required: z.boolean().default(false),
        options: z.array(z.string()).optional(),
      })
    )
    .default([]),
  on_submit: z.enum(["create", "update"]).default("create"),
})

// quick-actions
export const QuickActionsConfigSchema = z.object({
  actions: z
    .array(
      z.object({
        label: z.string(),
        icon: z.string().optional(),
        href: z.string(),
      })
    )
    .default([]),
})

// metric-row
export const MetricRowConfigSchema = z.object({
  metrics: z
    .array(
      z.object({
        title: z.string(),
        data_source: DataSourceEnum,
        aggregate: z.enum(["count", "sum", "avg"]).default("count"),
        aggregate_field: z.string().optional(),
        filter: FilterSchema,
        format: z.enum(["number", "currency", "percent"]).default("number"),
        icon: z.string().optional(),
      })
    )
    .default([]),
})

// team-list
export const TeamListConfigSchema = z.object({
  title: z.string().default("Your Team"),
  show_role: z.boolean().default(true),
  limit: z.number().optional(),
})

// calendar
export const CalendarConfigSchema = z.object({
  title: z.string().optional(),
  data_source: DataSourceEnum,
  date_field: z.string(),
  title_field: z.string(),
  color_field: z.string().optional(),
  filter: FilterSchema,
})

// embed
export const EmbedConfigSchema = z.object({
  url: z.string().url(),
  height: z.number().default(400),
  title: z.string().optional(),
})

// Map for runtime lookup
export const BLOCK_SCHEMAS: Record<string, z.ZodType> = {
  "stat-card": StatCardConfigSchema,
  "data-table": DataTableConfigSchema,
  "chart-area": ChartAreaConfigSchema,
  "chart-bar": ChartBarConfigSchema,
  "chart-pie": ChartPieConfigSchema,
  kanban: KanbanConfigSchema,
  "activity-feed": ActivityFeedConfigSchema,
  list: ListConfigSchema,
  text: TextConfigSchema,
  form: FormConfigSchema,
  "quick-actions": QuickActionsConfigSchema,
  "metric-row": MetricRowConfigSchema,
  "team-list": TeamListConfigSchema,
  calendar: CalendarConfigSchema,
  embed: EmbedConfigSchema,
}
