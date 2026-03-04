"use client"

import { useState } from "react"
import { Loader2, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Form, FormField } from "@/lib/types/forms"

interface PublicFormViewProps {
  form: Form
  orgName: string
  shareToken: string
}

export function PublicFormView({ form, orgName, shareToken }: PublicFormViewProps) {
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const setValue = (fieldId: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[fieldId]
      return next
    })
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    for (const field of form.fields) {
      if (field.type === "HIDDEN") continue
      if (field.required) {
        const val = values[field.id]
        if (val === undefined || val === "" || val === null) {
          newErrors[field.id] = `${field.label} is required`
        }
      }
      if (field.type === "EMAIL" && values[field.id]) {
        const emailVal = String(values[field.id])
        if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
          newErrors[field.id] = "Invalid email address"
        }
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setSubmitting(true)
    setSubmitError("")

    try {
      const res = await fetch("/api/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          share_token: shareToken,
          data: values,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        setSubmitError(body.error || "Failed to submit form")
        return
      }

      setSubmitted(true)
    } catch {
      setSubmitError("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-10 text-center">
          <CheckCircle2 className="h-12 w-12 text-[#5EC69A] mx-auto mb-4" strokeWidth={1.2} />
          <h2 className="font-[family-name:var(--font-display)] text-[1.5rem] text-[var(--text)] tracking-tight mb-2">
            Thank you!
          </h2>
          <p className="text-[0.9rem] text-[var(--text-muted)] font-light">
            Your response has been submitted successfully.
          </p>
        </div>
        <p className="text-center text-[0.72rem] text-[var(--text-dim)]">
          Powered by {orgName}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="font-[family-name:var(--font-display)] text-[1.1rem] text-[var(--text-muted)] tracking-tight mb-4">
          {orgName}
        </p>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-7 space-y-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-[1.8rem] text-[var(--text)] tracking-tight">
            {form.name}
          </h1>
          {form.description && (
            <p className="mt-1 text-[0.88rem] text-[var(--text-muted)] font-light">
              {form.description}
            </p>
          )}
        </div>

        <div className="space-y-5">
          {form.fields.map((field) => (
            <PublicField
              key={field.id}
              field={field}
              value={values[field.id]}
              error={errors[field.id]}
              onChange={(val) => setValue(field.id, val)}
            />
          ))}
        </div>

        {submitError && (
          <p className="text-[0.82rem] text-[#EF5B5B]">{submitError}</p>
        )}

        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full py-2.5 text-[0.88rem]"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit"
          )}
        </Button>
      </div>

      {/* Footer */}
      <p className="text-center text-[0.72rem] text-[var(--text-dim)]">
        Powered by {orgName}
      </p>
    </div>
  )
}

function PublicField({
  field,
  value,
  error,
  onChange,
}: {
  field: FormField
  value: unknown
  error?: string
  onChange: (val: unknown) => void
}) {
  const labelText = field.label || "Untitled"
  const isRequired = field.required

  if (field.type === "HIDDEN") return null

  const renderInput = () => {
    switch (field.type) {
      case "TEXT":
      case "EMAIL":
      case "PHONE":
      case "NUMBER":
      case "DATE":
        return (
          <Input
            type={
              field.type === "EMAIL" ? "email"
                : field.type === "PHONE" ? "tel"
                : field.type === "NUMBER" ? "number"
                : field.type === "DATE" ? "date"
                : "text"
            }
            placeholder={field.placeholder || ""}
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            className="mt-1.5 bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-dim)]"
          />
        )
      case "TEXTAREA":
        return (
          <Textarea
            placeholder={field.placeholder || ""}
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            className="mt-1.5 bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-dim)] resize-none"
          />
        )
      case "SELECT":
        return (
          <Select value={String(value ?? "")} onValueChange={(v) => onChange(v)}>
            <SelectTrigger className="mt-1.5 bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text)]">
              <SelectValue placeholder={field.placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent className="bg-[var(--bg-elevated)] border-[var(--border)]">
              {(field.options || []).map((opt, i) => (
                <SelectItem
                  key={i}
                  value={opt}
                  className="text-[var(--text-muted)] focus:text-[var(--text)] focus:bg-[rgba(232,224,212,0.03)]"
                >
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case "MULTI_SELECT": {
        const selected = Array.isArray(value) ? (value as string[]) : []
        return (
          <div className="mt-1.5 space-y-2">
            {(field.options || []).map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <Checkbox
                  checked={selected.includes(opt)}
                  onCheckedChange={(checked) => {
                    const next = checked
                      ? [...selected, opt]
                      : selected.filter((v) => v !== opt)
                    onChange(next)
                  }}
                  className="border-[var(--border)] data-[state=checked]:bg-[var(--accent)] data-[state=checked]:border-[var(--accent)]"
                />
                <span className="text-[0.85rem] text-[var(--text)] font-light">{opt}</span>
              </div>
            ))}
          </div>
        )
      }
      case "CHECKBOX":
        return (
          <div className="flex items-center gap-2 mt-1.5">
            <Checkbox
              checked={value === true}
              onCheckedChange={(checked) => onChange(checked === true)}
              className="border-[var(--border)] data-[state=checked]:bg-[var(--accent)] data-[state=checked]:border-[var(--accent)]"
            />
            <span className="text-[0.85rem] text-[var(--text)] font-light">{labelText}</span>
          </div>
        )
      case "RADIO":
        return (
          <div className="mt-1.5 space-y-2">
            {(field.options || []).map((opt, i) => (
              <label key={i} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={opt}
                  checked={value === opt}
                  onChange={() => onChange(opt)}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                <span className="text-[0.85rem] text-[var(--text)] font-light">{opt}</span>
              </label>
            ))}
          </div>
        )
      case "FILE":
        return (
          <div className="mt-1.5 rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-elevated)] p-6 text-center">
            <p className="text-[0.82rem] text-[var(--text-dim)]">
              File upload not available on public forms
            </p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div>
      {field.type !== "CHECKBOX" && (
        <Label className="text-[var(--text)] text-[0.85rem] font-light">
          {labelText}
          {isRequired && <span className="text-[var(--accent)] ml-0.5">*</span>}
        </Label>
      )}
      {renderInput()}
      {error && (
        <p className="mt-1 text-[0.78rem] text-[#EF5B5B]">{error}</p>
      )}
    </div>
  )
}
