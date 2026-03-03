import { SupabaseClient } from "@supabase/supabase-js";
import type { Entity, EntityField, EntityRecord, View, ViewConfig } from "@/lib/config/types";

export async function getUserOrg(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("organization_members")
    .select("org_id, role, organizations(*)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) return null;

  return {
    orgId: membership.org_id as string,
    role: membership.role as string,
    org: membership.organizations as unknown as { id: string; name: string; slug: string },
    userId: user.id,
  };
}

export async function getEntities(supabase: SupabaseClient, orgId: string) {
  const { data, error } = await supabase
    .from("entities")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as Entity[];
}

export async function getEntityBySlug(supabase: SupabaseClient, orgId: string, slug: string) {
  const { data: entity, error } = await supabase
    .from("entities")
    .select("*")
    .eq("org_id", orgId)
    .eq("slug", slug)
    .single();

  if (error) throw error;

  const { data: fields } = await supabase
    .from("entity_fields")
    .select("*")
    .eq("entity_id", entity.id)
    .order("sort_order", { ascending: true });

  const { data: views } = await supabase
    .from("views")
    .select("*")
    .eq("entity_id", entity.id)
    .order("sort_order", { ascending: true });

  return {
    entity: entity as Entity,
    fields: (fields || []) as EntityField[],
    views: (views || []) as View[],
  };
}

export async function getEntityRecords(
  supabase: SupabaseClient,
  orgId: string,
  entityId: string,
  viewConfig?: ViewConfig
) {
  let query = supabase
    .from("entity_records")
    .select("*")
    .eq("org_id", orgId)
    .eq("entity_id", entityId);

  if (viewConfig?.sort) {
    // Sort by data->field. For JSONB, we use order on created_at as fallback
    // since Supabase JS doesn't support JSONB path ordering easily
    query = query.order("created_at", {
      ascending: viewConfig.sort.direction === "asc",
    });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;

  let records = (data || []) as EntityRecord[];

  // Apply client-side filters from view config
  if (viewConfig?.filters?.length) {
    records = records.filter((record) =>
      viewConfig.filters!.every((filter) => {
        const val = record.data[filter.field];
        switch (filter.operator) {
          case "eq":
            return val === filter.value;
          case "neq":
            return val !== filter.value;
          case "contains":
            return String(val ?? "").toLowerCase().includes(filter.value.toLowerCase());
          default:
            return true;
        }
      })
    );
  }

  return records;
}

export async function createRecord(
  supabase: SupabaseClient,
  orgId: string,
  entityId: string,
  data: Record<string, unknown>
) {
  const { data: { user } } = await supabase.auth.getUser();

  const { data: record, error } = await supabase
    .from("entity_records")
    .insert({
      org_id: orgId,
      entity_id: entityId,
      data,
      created_by: user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return record as EntityRecord;
}

export async function updateRecord(
  supabase: SupabaseClient,
  recordId: string,
  data: Record<string, unknown>
) {
  const { data: record, error } = await supabase
    .from("entity_records")
    .update({ data })
    .eq("id", recordId)
    .select()
    .single();

  if (error) throw error;
  return record as EntityRecord;
}

export async function deleteRecord(supabase: SupabaseClient, recordId: string) {
  const { error } = await supabase
    .from("entity_records")
    .delete()
    .eq("id", recordId);

  if (error) throw error;
}

export async function getPage(supabase: SupabaseClient, orgId: string, slug: string) {
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("org_id", orgId)
    .eq("slug", slug)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data as import("@/lib/config/types").Page | null;
}

export async function getTheme(supabase: SupabaseClient, orgId: string) {
  const { data, error } = await supabase
    .from("themes")
    .select("*")
    .eq("org_id", orgId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data as import("@/lib/config/types").Theme | null;
}
