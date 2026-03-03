"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { UiConfig } from "@/lib/types/ui-config"

interface DynamicFieldsProps {
  config: UiConfig
  metadata?: Record<string, unknown> | null
}

export function DynamicFields({ config, metadata }: DynamicFieldsProps) {
  if (!config.fields || config.fields.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-[var(--text-muted)]">Custom Fields</div>
      {config.fields.map((field) => {
        const value = metadata?.[field.key] ?? ""

        switch (field.type) {
          case "checkbox":
            return (
              <div key={field.key} className="flex items-center gap-2">
                <Checkbox
                  id={`metadata.${field.key}`}
                  name={`metadata.${field.key}`}
                  defaultChecked={value === true || value === "true"}
                  value="true"
                />
                <Label htmlFor={`metadata.${field.key}`}>{field.label}</Label>
              </div>
            )

          case "select":
            return (
              <div key={field.key} className="space-y-1">
                <Label htmlFor={`metadata.${field.key}`}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Select name={`metadata.${field.key}`} defaultValue={value as string}>
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )

          case "textarea":
            return (
              <div key={field.key} className="space-y-1">
                <Label htmlFor={`metadata.${field.key}`}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Textarea
                  id={`metadata.${field.key}`}
                  name={`metadata.${field.key}`}
                  defaultValue={value as string}
                  placeholder={field.placeholder}
                  required={field.required}
                />
              </div>
            )

          default:
            return (
              <div key={field.key} className="space-y-1">
                <Label htmlFor={`metadata.${field.key}`}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Input
                  id={`metadata.${field.key}`}
                  name={`metadata.${field.key}`}
                  type={field.type === "phone" ? "tel" : field.type}
                  defaultValue={value as string}
                  placeholder={field.placeholder}
                  required={field.required}
                />
              </div>
            )
        }
      })}
    </div>
  )
}
