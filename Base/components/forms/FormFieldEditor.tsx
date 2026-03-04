"use client"

import { GripVertical, Trash2, Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { FormField, FormFieldType } from "@/lib/types/forms"
import { FORM_FIELD_TYPES } from "@/lib/types/forms"

interface FormFieldEditorProps {
  field: FormField
  onUpdate: (field: FormField) => void
  onRemove: () => void
}

const TYPES_WITH_OPTIONS: FormFieldType[] = ["SELECT", "MULTI_SELECT", "RADIO"]

export function FormFieldEditor({ field, onUpdate, onRemove }: FormFieldEditorProps) {
  const hasOptions = TYPES_WITH_OPTIONS.includes(field.type)

  const addOption = () => {
    onUpdate({
      ...field,
      options: [...(field.options || []), ""],
    })
  }

  const updateOption = (index: number, value: string) => {
    const options = [...(field.options || [])]
    options[index] = value
    onUpdate({ ...field, options })
  }

  const removeOption = (index: number) => {
    const options = [...(field.options || [])]
    options.splice(index, 1)
    onUpdate({ ...field, options })
  }

  return (
    <div className="group rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 hover:border-[rgba(232,224,212,0.1)] transition-colors">
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <div className="pt-2 cursor-grab text-[var(--text-dim)] opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4" />
        </div>

        <div className="flex-1 space-y-3">
          {/* Top row: label + type + required */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                value={field.label}
                onChange={(e) => onUpdate({ ...field, label: e.target.value })}
                placeholder="Field label"
                className="bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-dim)] text-[0.85rem] h-9"
              />
            </div>
            <Select
              value={field.type}
              onValueChange={(v: FormFieldType) => onUpdate({ ...field, type: v })}
            >
              <SelectTrigger className="w-[140px] bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text)] text-[0.82rem] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[var(--bg-elevated)] border-[var(--border)]">
                {FORM_FIELD_TYPES.map((t) => (
                  <SelectItem
                    key={t.value}
                    value={t.value}
                    className="text-[var(--text-muted)] focus:text-[var(--text)] focus:bg-[rgba(232,224,212,0.03)]"
                  >
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Placeholder */}
          <Input
            value={field.placeholder || ""}
            onChange={(e) => onUpdate({ ...field, placeholder: e.target.value })}
            placeholder="Placeholder text (optional)"
            className="bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-dim)] text-[0.82rem] h-9"
          />

          {/* Options for SELECT/MULTI_SELECT/RADIO */}
          {hasOptions && (
            <div className="space-y-2">
              <Label className="text-[var(--text-dim)] text-[0.72rem] uppercase tracking-wider">
                Options
              </Label>
              {(field.options || []).map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-dim)] text-[0.82rem] h-8"
                  />
                  <button
                    onClick={() => removeOption(i)}
                    className="p-1 text-[var(--text-dim)] hover:text-[#EF5B5B] transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={addOption}
                className="flex items-center gap-1.5 text-[0.78rem] text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add option
              </button>
            </div>
          )}

          {/* Required checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id={`required-${field.id}`}
              checked={field.required}
              onCheckedChange={(checked) =>
                onUpdate({ ...field, required: checked === true })
              }
              className="border-[var(--border)] data-[state=checked]:bg-[var(--accent)] data-[state=checked]:border-[var(--accent)]"
            />
            <Label
              htmlFor={`required-${field.id}`}
              className="text-[var(--text-muted)] text-[0.78rem] font-light cursor-pointer"
            >
              Required
            </Label>
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={onRemove}
          className="pt-2 p-1 text-[var(--text-dim)] hover:text-[#EF5B5B] opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
