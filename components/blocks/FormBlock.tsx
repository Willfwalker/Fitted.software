"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { BlockProps, FormConfig } from "@/lib/blocks/types"

export function FormBlock({ config, orgId }: BlockProps<FormConfig>) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setSuccess(false)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const record: Record<string, unknown> = {
      org_id: orgId,
      created_by: user?.id,
      ...values,
    }

    // Convert number fields
    for (const field of config.fields) {
      if (field.type === "number" && values[field.key]) {
        record[field.key] = Number(values[field.key])
      }
    }

    const { error } = await supabase.from(config.data_source).insert(record)

    if (!error) {
      setValues({})
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }

    setSubmitting(false)
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden h-full">
      {config.title && (
        <div className="px-7 py-5 border-b border-[var(--border)]">
          <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
            {config.title}
          </h3>
        </div>
      )}
      <form onSubmit={handleSubmit} className="px-7 py-5 space-y-4">
        {config.fields.map((field) => (
          <div key={field.key}>
            <label className="block text-[0.72rem] font-medium text-[var(--text-dim)] uppercase tracking-[0.1em] mb-1.5">
              {field.label}
              {field.required && (
                <span className="text-[var(--accent)]"> *</span>
              )}
            </label>
            {field.type === "textarea" ? (
              <textarea
                value={values[field.key] || ""}
                onChange={(e) =>
                  setValues({ ...values, [field.key]: e.target.value })
                }
                required={field.required}
                rows={3}
                className="w-full px-3 py-2 text-[0.85rem] bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)] font-light"
              />
            ) : field.type === "select" && field.options ? (
              <select
                value={values[field.key] || ""}
                onChange={(e) =>
                  setValues({ ...values, [field.key]: e.target.value })
                }
                required={field.required}
                className="w-full px-3 py-2 text-[0.85rem] bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[var(--accent)] font-light"
              >
                <option value="">Select...</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                value={values[field.key] || ""}
                onChange={(e) =>
                  setValues({ ...values, [field.key]: e.target.value })
                }
                required={field.required}
                className="w-full px-3 py-2 text-[0.85rem] bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)] font-light"
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 text-[0.82rem] font-light rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save"}
        </button>

        {success && (
          <p className="text-[0.75rem] text-[#5EC69A] font-light">
            Saved successfully!
          </p>
        )}
      </form>
    </div>
  )
}
