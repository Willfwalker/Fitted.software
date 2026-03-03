"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ColumnMapperProps {
  csvHeaders: string[]
  schemaFields: { value: string; label: string }[]
  mapping: Record<string, string>
  onMappingChange: (csvHeader: string, schemaField: string) => void
}

export function ColumnMapper({ csvHeaders, schemaFields, mapping, onMappingChange }: ColumnMapperProps) {
  return (
    <div className="space-y-2">
      <p className="text-[0.78rem] text-[var(--text-muted)] font-light mb-3">
        Map CSV columns to fields:
      </p>
      {csvHeaders.map((header) => (
        <div key={header} className="flex items-center gap-3">
          <span className="text-[0.82rem] text-[var(--text)] font-light w-[140px] truncate">
            {header}
          </span>
          <span className="text-[var(--text-dim)]">&rarr;</span>
          <Select
            value={mapping[header] || "_skip"}
            onValueChange={(v) => onMappingChange(header, v)}
          >
            <SelectTrigger className="w-[180px] bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.82rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
              <SelectItem value="_skip" className="text-[var(--text-dim)] focus:bg-[rgba(232,224,212,0.05)]">
                Skip
              </SelectItem>
              {schemaFields.map((f) => (
                <SelectItem key={f.value} value={f.value} className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  )
}
