"use client";

import { useRouter } from "next/navigation";
import type { EntityField, EntityRecord } from "@/lib/config/types";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EntityTableProps {
  fields: EntityField[];
  records: EntityRecord[];
  columns: string[];
  entitySlug: string;
}

export function EntityTable({ fields, records, columns, entitySlug }: EntityTableProps) {
  const router = useRouter();
  const fieldMap = Object.fromEntries(fields.map((f) => [f.name, f]));

  return (
    <div className="rounded-lg border border-[#2A2520] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-[#2A2520] hover:bg-transparent">
            {columns.map((col) => (
              <TableHead
                key={col}
                className="text-xs font-medium text-[#8A817A] bg-[#131110]"
              >
                {fieldMap[col]?.display_name ?? col}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 ? (
            <TableRow className="border-[#2A2520]">
              <TableCell
                colSpan={columns.length}
                className="text-center text-sm text-[#5A534D] py-12"
              >
                No records yet. Add your first one!
              </TableCell>
            </TableRow>
          ) : (
            records.map((record) => (
              <TableRow
                key={record.id}
                className="border-[#2A2520] cursor-pointer hover:bg-[#1A1816]"
                onClick={() => router.push(`/${entitySlug}/${record.id}`)}
              >
                {columns.map((col) => (
                  <TableCell key={col} className="text-sm text-[#E8E0D4]">
                    <CellValue field={fieldMap[col]} value={record.data[col]} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function CellValue({
  field,
  value,
}: {
  field?: EntityField;
  value: unknown;
}) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-[#5A534D]">—</span>;
  }

  const strValue = String(value);

  if (!field) return <>{strValue}</>;

  switch (field.field_type) {
    case "email":
      return (
        <a
          href={`mailto:${strValue}`}
          className="text-[#D4734E] hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {strValue}
        </a>
      );
    case "url":
      return (
        <a
          href={strValue}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#D4734E] hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {strValue}
        </a>
      );
    case "select":
      return (
        <Badge
          variant="secondary"
          className="bg-[#2A2520] text-[#E8E0D4] border-none text-xs"
        >
          {strValue}
        </Badge>
      );
    case "checkbox":
      return <>{value ? "Yes" : "No"}</>;
    case "date":
    case "datetime":
      try {
        return <>{new Date(strValue).toLocaleDateString()}</>;
      } catch {
        return <>{strValue}</>;
      }
    case "currency":
      return (
        <>
          ${Number(value).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}
        </>
      );
    default:
      return <>{strValue}</>;
  }
}
