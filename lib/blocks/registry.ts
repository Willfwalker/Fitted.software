import type { BlockRegistryEntry } from "./types"

// Lazy imports to avoid loading all blocks upfront
import { StatCardBlock } from "@/components/blocks/StatCardBlock"
import { DataTableBlock } from "@/components/blocks/DataTableBlock"
import { ChartBlock } from "@/components/blocks/ChartBlock"
import { TextBlock } from "@/components/blocks/TextBlock"
import { QuickActionsBlock } from "@/components/blocks/QuickActionsBlock"
import { ActivityFeedBlock } from "@/components/blocks/ActivityFeedBlock"
import { TeamListBlock } from "@/components/blocks/TeamListBlock"
import { ListBlock } from "@/components/blocks/ListBlock"
import { KanbanBlock } from "@/components/blocks/KanbanBlock"
import { FormBlock } from "@/components/blocks/FormBlock"
import { MetricRowBlock } from "@/components/blocks/MetricRowBlock"
import { CalendarBlock } from "@/components/blocks/CalendarBlock"
import { EmbedBlock } from "@/components/blocks/EmbedBlock"

// Chart wrapper components that pass the variant prop
function ChartAreaBlock(props: any) {
  return ChartBlock({ ...props, variant: "area" })
}
function ChartBarBlock(props: any) {
  return ChartBlock({ ...props, variant: "bar" })
}
function ChartPieBlock(props: any) {
  return ChartBlock({ ...props, variant: "pie" })
}

export const BLOCK_REGISTRY: Record<string, BlockRegistryEntry> = {
  "stat-card": {
    component: StatCardBlock,
    label: "Stat Card",
    description: "Single metric with icon and optional subtitle",
    defaultColSpan: 1,
    icon: "Hash",
  },
  "data-table": {
    component: DataTableBlock,
    label: "Data Table",
    description: "Sortable, filterable table of records",
    defaultColSpan: 4,
    icon: "Table",
  },
  "chart-area": {
    component: ChartAreaBlock,
    label: "Area Chart",
    description: "Area chart for time-series data",
    defaultColSpan: 3,
    icon: "TrendingUp",
  },
  "chart-bar": {
    component: ChartBarBlock,
    label: "Bar Chart",
    description: "Bar chart for categorical comparisons",
    defaultColSpan: 2,
    icon: "BarChart3",
  },
  "chart-pie": {
    component: ChartPieBlock,
    label: "Pie Chart",
    description: "Pie/donut chart for proportional data",
    defaultColSpan: 2,
    icon: "PieChart",
  },
  kanban: {
    component: KanbanBlock,
    label: "Kanban Board",
    description: "Kanban board grouped by a stage field",
    defaultColSpan: 4,
    icon: "Columns3",
  },
  "activity-feed": {
    component: ActivityFeedBlock,
    label: "Activity Feed",
    description: "Timeline of recent activities",
    defaultColSpan: 1,
    icon: "Activity",
  },
  list: {
    component: ListBlock,
    label: "Record List",
    description: "Simple list of records from a data source",
    defaultColSpan: 2,
    icon: "List",
  },
  text: {
    component: TextBlock,
    label: "Text",
    description: "Static text or markdown content",
    defaultColSpan: 4,
    icon: "Type",
  },
  form: {
    component: FormBlock,
    label: "Form",
    description: "Data entry form for creating records",
    defaultColSpan: 2,
    icon: "FileInput",
  },
  "quick-actions": {
    component: QuickActionsBlock,
    label: "Quick Actions",
    description: "Row of action buttons with icons",
    defaultColSpan: 4,
    icon: "Zap",
  },
  "metric-row": {
    component: MetricRowBlock,
    label: "Metric Row",
    description: "2-4 mini stat cards in a row",
    defaultColSpan: 4,
    icon: "BarChart2",
  },
  "team-list": {
    component: TeamListBlock,
    label: "Team List",
    description: "List of organization members",
    defaultColSpan: 4,
    icon: "Users",
  },
  calendar: {
    component: CalendarBlock,
    label: "Calendar",
    description: "Calendar view of date-based data",
    defaultColSpan: 4,
    icon: "Calendar",
  },
  embed: {
    component: EmbedBlock,
    label: "Embed",
    description: "External content via iframe",
    defaultColSpan: 4,
    icon: "ExternalLink",
  },
}
