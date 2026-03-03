import { SupabaseClient } from "@supabase/supabase-js";

// Save a config version for rollback
async function saveConfigVersion(
  supabase: SupabaseClient,
  orgId: string,
  targetType: string,
  targetId: string,
  previousValue: unknown,
  newValue: unknown,
  userId: string,
  description: string
) {
  await supabase.from("config_versions").insert({
    org_id: orgId,
    target_type: targetType,
    target_id: targetId,
    previous_value: previousValue,
    new_value: newValue,
    changed_by: userId,
    change_description: description,
  });
}

export async function handleAddField(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
  args: {
    entitySlug: string;
    fieldName: string;
    displayName: string;
    fieldType: string;
    isRequired?: boolean;
    options?: Record<string, unknown>;
  }
) {
  // Get entity
  const { data: entity, error: entityErr } = await supabase
    .from("entities")
    .select("id")
    .eq("org_id", orgId)
    .eq("slug", args.entitySlug)
    .single();

  if (entityErr || !entity) return { error: `Entity "${args.entitySlug}" not found` };

  // Get max sort_order
  const { data: fields } = await supabase
    .from("entity_fields")
    .select("sort_order")
    .eq("entity_id", entity.id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = ((fields?.[0]?.sort_order as number) ?? -1) + 1;

  // Insert field
  const { data: newField, error } = await supabase
    .from("entity_fields")
    .insert({
      entity_id: entity.id,
      name: args.fieldName,
      display_name: args.displayName,
      field_type: args.fieldType,
      is_required: args.isRequired ?? false,
      options: args.options ?? {},
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await saveConfigVersion(
    supabase, orgId, "entity_field", newField.id,
    null, newField, userId,
    `Added field "${args.displayName}" to ${args.entitySlug}`
  );

  return { success: true, message: `Added "${args.displayName}" field to ${args.entitySlug}` };
}

export async function handleRemoveField(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
  args: { entitySlug: string; fieldName: string }
) {
  const { data: entity } = await supabase
    .from("entities")
    .select("id")
    .eq("org_id", orgId)
    .eq("slug", args.entitySlug)
    .single();

  if (!entity) return { error: `Entity "${args.entitySlug}" not found` };

  const { data: field } = await supabase
    .from("entity_fields")
    .select("*")
    .eq("entity_id", entity.id)
    .eq("name", args.fieldName)
    .single();

  if (!field) return { error: `Field "${args.fieldName}" not found` };
  if (field.is_system) return { error: `Cannot remove system field "${args.fieldName}"` };

  await saveConfigVersion(
    supabase, orgId, "entity_field", field.id,
    field, null, userId,
    `Removed field "${field.display_name}" from ${args.entitySlug}`
  );

  const { error } = await supabase
    .from("entity_fields")
    .delete()
    .eq("id", field.id);

  if (error) return { error: error.message };
  return { success: true, message: `Removed "${field.display_name}" field from ${args.entitySlug}` };
}

export async function handleModifyView(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
  args: {
    entitySlug: string;
    viewName: string;
    config: Record<string, unknown>;
  }
) {
  const { data: entity } = await supabase
    .from("entities")
    .select("id")
    .eq("org_id", orgId)
    .eq("slug", args.entitySlug)
    .single();

  if (!entity) return { error: `Entity "${args.entitySlug}" not found` };

  const { data: view } = await supabase
    .from("views")
    .select("*")
    .eq("entity_id", entity.id)
    .eq("name", args.viewName)
    .single();

  if (!view) return { error: `View "${args.viewName}" not found` };

  const previousConfig = view.config;
  const newConfig = { ...previousConfig as object, ...args.config };

  const { error } = await supabase
    .from("views")
    .update({ config: newConfig })
    .eq("id", view.id);

  if (error) return { error: error.message };

  await saveConfigVersion(
    supabase, orgId, "view", view.id,
    previousConfig, newConfig, userId,
    `Modified view "${args.viewName}"`
  );

  return { success: true, message: `Updated view "${args.viewName}"` };
}

export async function handleCreateView(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
  args: {
    entitySlug: string;
    name: string;
    viewType: string;
    config: Record<string, unknown>;
  }
) {
  const { data: entity } = await supabase
    .from("entities")
    .select("id")
    .eq("org_id", orgId)
    .eq("slug", args.entitySlug)
    .single();

  if (!entity) return { error: `Entity "${args.entitySlug}" not found` };

  const { data: views } = await supabase
    .from("views")
    .select("sort_order")
    .eq("entity_id", entity.id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = ((views?.[0]?.sort_order as number) ?? -1) + 1;

  const { data: newView, error } = await supabase
    .from("views")
    .insert({
      org_id: orgId,
      entity_id: entity.id,
      name: args.name,
      view_type: args.viewType,
      config: args.config,
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await saveConfigVersion(
    supabase, orgId, "view", newView.id,
    null, newView, userId,
    `Created view "${args.name}"`
  );

  return { success: true, message: `Created new ${args.viewType} view "${args.name}"` };
}

export async function handleModifyLayout(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
  args: {
    pageSlug: string;
    layout: Array<{
      id: string;
      type: string;
      props: Record<string, unknown>;
      position: { x: number; y: number; w: number; h: number };
    }>;
  }
) {
  const { data: page } = await supabase
    .from("pages")
    .select("*")
    .eq("org_id", orgId)
    .eq("slug", args.pageSlug)
    .single();

  if (!page) return { error: `Page "${args.pageSlug}" not found` };

  const previousLayout = page.layout;

  const { error } = await supabase
    .from("pages")
    .update({ layout: args.layout })
    .eq("id", page.id);

  if (error) return { error: error.message };

  await saveConfigVersion(
    supabase, orgId, "page", page.id,
    previousLayout, args.layout, userId,
    `Modified layout of page "${args.pageSlug}"`
  );

  return { success: true, message: `Updated dashboard layout` };
}

export async function handleChangeTheme(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
  args: { variables: Record<string, string> }
) {
  const { data: theme } = await supabase
    .from("themes")
    .select("*")
    .eq("org_id", orgId)
    .single();

  if (!theme) {
    // Create theme
    const { error } = await supabase.from("themes").insert({
      org_id: orgId,
      variables: args.variables,
    });
    if (error) return { error: error.message };
    return { success: true, message: "Theme created" };
  }

  const previousVars = theme.variables;
  const newVars = { ...previousVars as object, ...args.variables };

  const { error } = await supabase
    .from("themes")
    .update({ variables: newVars })
    .eq("id", theme.id);

  if (error) return { error: error.message };

  await saveConfigVersion(
    supabase, orgId, "theme", theme.id,
    previousVars, newVars, userId,
    `Changed theme variables: ${Object.keys(args.variables).join(", ")}`
  );

  return { success: true, message: `Updated theme: ${Object.keys(args.variables).join(", ")}` };
}

export async function handleCreateEntity(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
  args: {
    name: string;
    displayName: string;
    slug: string;
    icon?: string;
    description?: string;
    fields: Array<{
      name: string;
      displayName: string;
      fieldType: string;
      isRequired?: boolean;
      options?: Record<string, unknown>;
    }>;
  }
) {
  // Create entity
  const { data: entity, error } = await supabase
    .from("entities")
    .insert({
      org_id: orgId,
      name: args.name,
      display_name: args.displayName,
      slug: args.slug,
      icon: args.icon ?? "file-text",
      description: args.description,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // Create fields
  const fieldInserts = args.fields.map((f, i) => ({
    entity_id: entity.id,
    name: f.name,
    display_name: f.displayName,
    field_type: f.fieldType,
    is_required: f.isRequired ?? false,
    options: f.options ?? {},
    sort_order: i,
  }));

  if (fieldInserts.length > 0) {
    const { error: fieldErr } = await supabase
      .from("entity_fields")
      .insert(fieldInserts);
    if (fieldErr) return { error: fieldErr.message };
  }

  // Create default table view
  const defaultColumns = args.fields.map((f) => f.name);
  await supabase.from("views").insert({
    org_id: orgId,
    entity_id: entity.id,
    name: `All ${args.displayName}`,
    view_type: "table",
    config: { columns: defaultColumns, sort: { field: defaultColumns[0] ?? "name", direction: "asc" }, filters: [] },
    is_default: true,
    sort_order: 0,
  });

  await saveConfigVersion(
    supabase, orgId, "entity", entity.id,
    null, entity, userId,
    `Created entity "${args.displayName}"`
  );

  return {
    success: true,
    message: `Created entity "${args.displayName}" with ${args.fields.length} fields. Navigate to /${args.slug} to see it.`,
  };
}

export async function handleUndoLastChange(
  supabase: SupabaseClient,
  orgId: string,
  userId: string
) {
  // Get the most recent config version
  const { data: version } = await supabase
    .from("config_versions")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!version) return { error: "No changes to undo" };

  const { target_type, target_id, previous_value } = version;

  if (previous_value === null) {
    // It was a creation — delete the thing
    const { error } = await supabase
      .from(target_type === "entity_field" ? "entity_fields" : target_type === "entity" ? "entities" : target_type === "view" ? "views" : target_type === "page" ? "pages" : "themes")
      .delete()
      .eq("id", target_id);

    if (error) return { error: error.message };
  } else {
    // Restore previous value
    const table = target_type === "entity_field" ? "entity_fields" : target_type === "entity" ? "entities" : target_type === "view" ? "views" : target_type === "page" ? "pages" : "themes";

    if (target_type === "view" || target_type === "page") {
      // Restore config/layout
      const key = target_type === "page" ? "layout" : "config";
      const { error } = await supabase
        .from(table)
        .update({ [key]: previous_value })
        .eq("id", target_id);
      if (error) return { error: error.message };
    } else if (target_type === "theme") {
      const { error } = await supabase
        .from("themes")
        .update({ variables: previous_value })
        .eq("id", target_id);
      if (error) return { error: error.message };
    } else {
      // For fields/entities, restore the full row
      const prevVal = previous_value as Record<string, unknown>;
      const { error } = await supabase
        .from(table)
        .upsert(prevVal);
      if (error) return { error: error.message };
    }
  }

  // Delete the version entry
  await supabase.from("config_versions").delete().eq("id", version.id);

  await saveConfigVersion(
    supabase, orgId, "undo", version.id as string,
    version, null, userId,
    `Undid: ${version.change_description}`
  );

  return { success: true, message: `Undid: ${version.change_description}` };
}
