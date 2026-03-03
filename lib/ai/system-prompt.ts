import { SupabaseClient } from "@supabase/supabase-js";

export async function buildSystemPrompt(supabase: SupabaseClient, orgId: string) {
  // Fetch current org state
  const [entitiesResult, pagesResult, themeResult] = await Promise.all([
    supabase
      .from("entities")
      .select("*, entity_fields(*)")
      .eq("org_id", orgId)
      .order("created_at"),
    supabase.from("pages").select("*").eq("org_id", orgId),
    supabase.from("themes").select("*").eq("org_id", orgId).single(),
  ]);

  const entities = entitiesResult.data ?? [];
  const pages = pagesResult.data ?? [];
  const theme = themeResult.data;

  // Build schema description
  const entityDescriptions = entities.map((e) => {
    const fields = (e.entity_fields ?? []) as Array<{
      name: string;
      display_name: string;
      field_type: string;
      is_required: boolean;
      is_system: boolean;
      options: Record<string, unknown>;
    }>;
    const fieldList = fields
      .sort((a, b) => (a as unknown as { sort_order: number }).sort_order - (b as unknown as { sort_order: number }).sort_order)
      .map(
        (f) =>
          `  - ${f.name} (${f.field_type}${f.is_required ? ", required" : ""}${f.is_system ? ", system" : ""}${f.field_type === "select" ? `, choices: ${JSON.stringify((f.options as { choices?: string[] })?.choices ?? [])}` : ""})`
      )
      .join("\n");
    return `Entity: ${e.display_name} (slug: ${e.slug}, id: ${e.id})\nFields:\n${fieldList}`;
  });

  const pageDescriptions = pages.map(
    (p) =>
      `Page: ${p.title} (slug: ${p.slug}, id: ${p.id}), widgets: ${(p.layout as unknown[])?.length ?? 0}`
  );

  const themeDesc = theme
    ? `Current theme variables: ${JSON.stringify(theme.variables)}`
    : "No custom theme set.";

  return `You are an AI assistant for a customizable SaaS platform called Fitted. You help users customize their workspace by modifying entities, fields, views, dashboard layouts, and themes.

## Current Workspace State

### Entities
${entityDescriptions.join("\n\n") || "No entities defined yet."}

### Pages
${pageDescriptions.join("\n") || "No custom pages."}

### Theme
${themeDesc}

## Available Widget Types
- kpi-card: Shows a count/metric from an entity (props: title, entity, metric, filter)
- activity-feed: Shows recent records (props: title, limit)
- entity-table-widget: Inline table view (props: entity, viewConfig, limit)

## Guidelines
- When the user asks to add/remove fields, use the addField or removeField tools.
- When they want to change views (columns, sorting, filtering), use modifyView.
- When they want to rearrange dashboard widgets, use modifyLayout.
- When they want to change colors/theme, use changeTheme.
- When they want a new data type, use createEntity.
- Always confirm what you did after making changes.
- Be concise and helpful. Use a friendly, professional tone.
- If a request is unclear, ask for clarification before making changes.
- System fields and system entities cannot be deleted.`;
}
