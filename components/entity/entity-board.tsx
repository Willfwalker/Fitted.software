"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { EntityField, EntityRecord } from "@/lib/config/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EntityBoardProps {
  fields: EntityField[];
  records: EntityRecord[];
  groupByField: string;
  columns: string[];
  cardFields: string[];
  entitySlug: string;
}

export function EntityBoard({
  fields,
  records,
  groupByField,
  columns,
  cardFields,
  entitySlug,
}: EntityBoardProps) {
  const router = useRouter();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const fieldMap = Object.fromEntries(fields.map((f) => [f.name, f]));

  // Group records by the group field value
  const grouped: Record<string, EntityRecord[]> = {};
  columns.forEach((col) => {
    grouped[col] = [];
  });
  records.forEach((record) => {
    const val = String(record.data[groupByField] ?? "");
    if (grouped[val]) {
      grouped[val].push(record);
    } else {
      // Record has a value not in columns — add to first column
      grouped[columns[0]]?.push(record);
    }
  });

  async function handleDrop(recordId: string, newColumnValue: string) {
    const supabase = createClient();
    const record = records.find((r) => r.id === recordId);
    if (!record) return;

    const updatedData = { ...record.data, [groupByField]: newColumnValue };
    await supabase
      .from("entity_records")
      .update({ data: updatedData })
      .eq("id", recordId);

    router.refresh();
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => (
        <div
          key={col}
          className="flex-shrink-0 w-72"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const recordId = e.dataTransfer.getData("text/plain");
            if (recordId) handleDrop(recordId, col);
            setDraggingId(null);
          }}
        >
          {/* Column header */}
          <div className="flex items-center justify-between px-2 mb-3">
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-[#2A2520] text-[#E8E0D4] border-none text-xs"
              >
                {col}
              </Badge>
              <span className="text-xs text-[#5A534D]">
                {grouped[col]?.length ?? 0}
              </span>
            </div>
          </div>

          {/* Cards */}
          <ScrollArea className="space-y-2 min-h-[200px]">
            <div className="space-y-2">
              {(grouped[col] ?? []).map((record) => (
                <Card
                  key={record.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", record.id);
                    setDraggingId(record.id);
                  }}
                  onDragEnd={() => setDraggingId(null)}
                  onClick={() => router.push(`/${entitySlug}/${record.id}`)}
                  className={`p-3 bg-[#1A1816] border-[#2A2520] cursor-pointer hover:border-[#D4734E]/30 transition-all ${
                    draggingId === record.id ? "opacity-50" : ""
                  }`}
                >
                  {cardFields.map((fieldName) => {
                    const field = fieldMap[fieldName];
                    const value = record.data[fieldName];
                    if (!value && value !== 0) return null;
                    return (
                      <div key={fieldName} className="mb-1 last:mb-0">
                        {fieldName === cardFields[0] ? (
                          <p className="text-sm font-medium text-[#E8E0D4]">
                            {String(value)}
                          </p>
                        ) : (
                          <p className="text-xs text-[#8A817A]">
                            {field?.display_name}: {String(value)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  );
}
