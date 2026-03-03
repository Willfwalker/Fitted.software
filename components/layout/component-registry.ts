import type { ComponentType } from "react";
import { KPICard } from "@/components/widgets/kpi-card";
import { ActivityFeed } from "@/components/widgets/activity-feed";
import { EntityTableWidget } from "@/components/widgets/entity-table-widget";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = ComponentType<any>;

// Maps widget type strings → React components
const REGISTRY: Record<string, AnyComponent> = {
  "kpi-card": KPICard as unknown as AnyComponent,
  "activity-feed": ActivityFeed as unknown as AnyComponent,
  "entity-table-widget": EntityTableWidget as unknown as AnyComponent,
};

export function getComponent(type: string) {
  return REGISTRY[type] ?? null;
}

export function getAvailableWidgetTypes() {
  return Object.keys(REGISTRY).map((type) => ({
    type,
    description: WIDGET_DESCRIPTIONS[type] ?? type,
  }));
}

const WIDGET_DESCRIPTIONS: Record<string, string> = {
  "kpi-card": "A metric card showing a count or value from an entity",
  "activity-feed": "Shows recent record changes across entities",
  "entity-table-widget": "Embeds an entity table view inline",
};
