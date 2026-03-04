"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { renderTemplate } from "@/lib/types/messaging"
import type { MessageTemplate } from "@/lib/types/messaging"

interface TemplatePreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: MessageTemplate
}

export function TemplatePreview({ open, onOpenChange, template }: TemplatePreviewProps) {
  const [values, setValues] = useState<Record<string, string>>({})

  const renderedSubject = template.subject
    ? renderTemplate(template.subject, values)
    : null
  const renderedBody = renderTemplate(template.body, values)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-display)] text-[1.3rem] text-[var(--text)] tracking-tight">
            {template.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Variable inputs */}
          {template.variables.length > 0 && (
            <div className="space-y-3">
              <Label className="text-[0.78rem] text-[var(--text-muted)]">Fill in variables to preview</Label>
              <div className="grid grid-cols-2 gap-2">
                {template.variables.map((v) => (
                  <div key={v} className="space-y-1">
                    <label className="text-[0.72rem] text-[var(--text-dim)]">{`{{${v}}}`}</label>
                    <Input
                      value={values[v] || ""}
                      onChange={(e) => setValues({ ...values, [v]: e.target.value })}
                      placeholder={v}
                      className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.82rem] h-8 focus-visible:ring-[var(--accent)]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Preview</Label>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 space-y-2">
              {renderedSubject && (
                <p className="text-[0.88rem] text-[var(--text)] font-medium">
                  {renderedSubject}
                </p>
              )}
              <div className="text-[0.85rem] text-[var(--text-muted)] font-light whitespace-pre-wrap leading-relaxed">
                {renderedBody}
              </div>
            </div>
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-4 text-[0.72rem] text-[var(--text-dim)]">
            <span>Channel: {template.channel}</span>
            <span>Created: {new Date(template.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
