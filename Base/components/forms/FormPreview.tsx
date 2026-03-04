"use client"

import type { FormField } from "@/lib/types/forms"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface FormPreviewProps {
  name: string
  description: string
  fields: FormField[]
}

export function FormPreview({ name, description, fields }: FormPreviewProps) {
  return (
    <div className="max-w-[640px] mx-auto">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-7 space-y-6">
        {/* Header */}
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-[1.5rem] text-[var(--text)] tracking-tight">
            {name || "Untitled Form"}
          </h2>
          {description && (
            <p className="mt-1 text-[0.88rem] text-[var(--text-muted)] font-light">
              {description}
            </p>
          )}
        </div>

        {/* Fields */}
        {fields.length === 0 ? (
          <p className="text-[0.85rem] text-[var(--text-dim)] font-light text-center py-8">
            Add fields to see the preview
          </p>
        ) : (
          <div className="space-y-5">
            {fields.map((field) => (
              <PreviewField key={field.id} field={field} />
            ))}
          </div>
        )}

        {/* Submit button */}
        {fields.length > 0 && (
          <Button
            disabled
            className="w-full bg-[var(--accent)] text-[var(--bg)] rounded-full py-2.5 text-[0.88rem] cursor-not-allowed opacity-70"
          >
            Submit
          </Button>
        )}
      </div>

      <p className="text-center text-[0.72rem] text-[var(--text-dim)] mt-4">
        This is a preview. Submissions are disabled.
      </p>
    </div>
  )
}

function PreviewField({ field }: { field: FormField }) {
  const labelText = field.label || "Untitled"
  const isRequired = field.required

  switch (field.type) {
    case "TEXT":
    case "EMAIL":
    case "PHONE":
    case "NUMBER":
    case "DATE":
      return (
        <div>
          <Label className="text-[var(--text)] text-[0.85rem] font-light">
            {labelText}
            {isRequired && <span className="text-[var(--accent)] ml-0.5">*</span>}
          </Label>
          <Input
            type={field.type === "EMAIL" ? "email" : field.type === "PHONE" ? "tel" : field.type === "NUMBER" ? "number" : field.type === "DATE" ? "date" : "text"}
            placeholder={field.placeholder || ""}
            disabled
            className="mt-1.5 bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-dim)]"
          />
        </div>
      )
    case "TEXTAREA":
      return (
        <div>
          <Label className="text-[var(--text)] text-[0.85rem] font-light">
            {labelText}
            {isRequired && <span className="text-[var(--accent)] ml-0.5">*</span>}
          </Label>
          <Textarea
            placeholder={field.placeholder || ""}
            disabled
            rows={4}
            className="mt-1.5 bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-dim)] resize-none"
          />
        </div>
      )
    case "SELECT":
      return (
        <div>
          <Label className="text-[var(--text)] text-[0.85rem] font-light">
            {labelText}
            {isRequired && <span className="text-[var(--accent)] ml-0.5">*</span>}
          </Label>
          <Select disabled>
            <SelectTrigger className="mt-1.5 bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text)]">
              <SelectValue placeholder={field.placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent className="bg-[var(--bg-elevated)] border-[var(--border)]">
              {(field.options || []).map((opt, i) => (
                <SelectItem key={i} value={opt || `option-${i}`}>
                  {opt || `Option ${i + 1}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    case "MULTI_SELECT":
      return (
        <div>
          <Label className="text-[var(--text)] text-[0.85rem] font-light">
            {labelText}
            {isRequired && <span className="text-[var(--accent)] ml-0.5">*</span>}
          </Label>
          <div className="mt-1.5 space-y-2">
            {(field.options || []).map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <Checkbox disabled className="border-[var(--border)]" />
                <span className="text-[0.85rem] text-[var(--text-muted)] font-light">
                  {opt || `Option ${i + 1}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    case "CHECKBOX":
      return (
        <div className="flex items-center gap-2">
          <Checkbox disabled className="border-[var(--border)]" />
          <Label className="text-[var(--text)] text-[0.85rem] font-light cursor-pointer">
            {labelText}
            {isRequired && <span className="text-[var(--accent)] ml-0.5">*</span>}
          </Label>
        </div>
      )
    case "RADIO":
      return (
        <div>
          <Label className="text-[var(--text)] text-[0.85rem] font-light">
            {labelText}
            {isRequired && <span className="text-[var(--accent)] ml-0.5">*</span>}
          </Label>
          <div className="mt-1.5 space-y-2">
            {(field.options || []).map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border border-[var(--border)]" />
                <span className="text-[0.85rem] text-[var(--text-muted)] font-light">
                  {opt || `Option ${i + 1}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    case "FILE":
      return (
        <div>
          <Label className="text-[var(--text)] text-[0.85rem] font-light">
            {labelText}
            {isRequired && <span className="text-[var(--accent)] ml-0.5">*</span>}
          </Label>
          <div className="mt-1.5 rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-elevated)] p-6 text-center">
            <p className="text-[0.82rem] text-[var(--text-dim)]">
              Click or drag to upload
            </p>
          </div>
        </div>
      )
    case "HIDDEN":
      return null
    default:
      return null
  }
}
