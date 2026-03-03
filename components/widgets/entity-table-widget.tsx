import { createClient } from "@/lib/supabase/server";
import { getEntityBySlug, getEntityRecords } from "@/lib/entity/queries";
import type { ViewConfig } from "@/lib/config/types";

interface EntityTableWidgetProps {
  entity: string;
  viewConfig?: ViewConfig;
  orgId: string;
  limit?: number;
}

export async function EntityTableWidget({
  entity,
  viewConfig,
  orgId,
  limit = 5,
}: EntityTableWidgetProps) {
  const supabase = await createClient();

  try {
    const { entity: entityData, fields } = await getEntityBySlug(supabase, orgId, entity);
    const records = await getEntityRecords(supabase, orgId, entityData.id, viewConfig);
    const displayRecords = records.slice(0, limit);

    const columns = viewConfig?.columns ?? fields.map((f) => f.name);
    const fieldMap = Object.fromEntries(fields.map((f) => [f.name, f]));

    return (
      <div className="rounded-lg border border-[#2A2520] bg-[#1A1816] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2A2520]">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-medium text-[#8A817A]"
                >
                  {fieldMap[col]?.display_name ?? col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRecords.map((record) => (
              <tr key={record.id} className="border-b border-[#2A2520] last:border-0">
                {columns.map((col) => (
                  <td key={col} className="px-4 py-3 text-[#E8E0D4]">
                    {String(record.data[col] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  } catch {
    return (
      <div className="rounded-lg border border-[#2A2520] bg-[#1A1816] p-4 text-sm text-[#5A534D]">
        Could not load {entity} data.
      </div>
    );
  }
}
