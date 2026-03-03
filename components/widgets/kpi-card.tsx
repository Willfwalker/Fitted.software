import { createClient } from "@/lib/supabase/server";

interface KPICardProps {
  title: string;
  entity?: string;
  metric?: string;
  filter?: { field: string; value: string };
  orgId: string;
}

export async function KPICard({ title, entity, metric, filter, orgId }: KPICardProps) {
  let value: number | string = "—";

  if (entity && metric === "count") {
    try {
      const supabase = await createClient();

      // Get entity ID from slug
      const { data: entityData } = await supabase
        .from("entities")
        .select("id")
        .eq("org_id", orgId)
        .eq("slug", entity)
        .single();

      if (entityData) {
        let query = supabase
          .from("entity_records")
          .select("id", { count: "exact" })
          .eq("org_id", orgId)
          .eq("entity_id", entityData.id);

        if (filter) {
          query = query.contains("data", { [filter.field]: filter.value });
        }

        const { count } = await query;
        value = count ?? 0;
      }
    } catch {
      value = "—";
    }
  }

  return (
    <div className="rounded-lg border border-[#2A2520] bg-[#1A1816] p-5">
      <p className="text-xs font-medium text-[#8A817A] mb-1">{title}</p>
      <p
        className="text-2xl font-normal text-[#E8E0D4]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </p>
    </div>
  );
}
