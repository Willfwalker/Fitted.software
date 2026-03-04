"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createTemplate, updateTemplate } from "@/lib/actions/templates"
import type { MessageTemplate, MESSAGE_CHANNELS } from "@/lib/types/messaging"

interface TemplateFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: MessageTemplate | null
}

export function TemplateForm({ open, onOpenChange, template }: TemplateFormProps) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [channel, setChannel] = useState<"EMAIL" | "SMS">("EMAIL")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isEditing = !!template

  useEffect(() => {
    if (template) {
      setName(template.name)
      setSubject(template.subject || "")
      setBody(template.body)
      setChannel(template.channel)
    } else {
      setName("")
      setSubject("")
      setBody("")
      setChannel("EMAIL")
    }
    setError(null)
  }, [template, open])

  // Extract detected variables from body + subject
  const detectedVars = (() => {
    const combined = `${subject} ${body}`
    const matches = combined.match(/\{\{(\w+)\}\}/g)
    if (!matches) return []
    return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, "")))]
  })()

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("Template name is required")
      return
    }
    if (!body.trim()) {
      setError("Template body is required")
      return
    }
    setError(null)

    startTransition(async () => {
      const data = {
        name: name.trim(),
        subject: subject.trim() || undefined,
        body: body.trim(),
        channel,
        variables: detectedVars,
      }

      const result = isEditing
        ? await updateTemplate(template.id, data)
        : await createTemplate(data)

      if (result.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-display)] text-[1.3rem] text-[var(--text)] tracking-tight">
            {isEditing ? "Edit Template" : "New Template"}
          </DialogTitle>
          <DialogDescription className="text-[var(--text-muted)] text-[0.82rem]">
            {isEditing
              ? "Update this message template."
              : "Create a reusable template. Use {{variable}} for dynamic content."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-[0.78rem] text-[var(--text-muted)]">Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Welcome Email"
                className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.88rem] focus-visible:ring-[var(--accent)]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[0.78rem] text-[var(--text-muted)]">Channel</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as "EMAIL" | "SMS")}>
                <SelectTrigger className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.88rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                  <SelectItem value="EMAIL" className="text-[var(--text)]">Email</SelectItem>
                  <SelectItem value="SMS" className="text-[var(--text)]">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {channel === "EMAIL" && (
            <div className="space-y-1.5">
              <Label className="text-[0.78rem] text-[var(--text-muted)]">Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Welcome to {{company}}"
                className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.88rem] focus-visible:ring-[var(--accent)]"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Body *</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={"Hi {{name}},\n\nWelcome to {{company}}! We're excited to have you on board.\n\nBest,\n{{sender}}"}
              rows={8}
              className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.88rem] focus-visible:ring-[var(--accent)] resize-none font-mono text-[0.82rem]"
            />
          </div>

          {detectedVars.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-[0.78rem] text-[var(--text-muted)]">Detected Variables</Label>
              <div className="flex flex-wrap gap-1.5">
                {detectedVars.map((v) => (
                  <span
                    key={v}
                    className="text-[0.75rem] px-2 py-0.5 rounded-full bg-[rgba(212,115,78,0.1)] text-[var(--accent)] font-light"
                  >
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-[0.82rem] text-red-400 font-light">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-[var(--text-muted)] text-[0.82rem]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-full px-5 text-[0.82rem]"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-1.5" />
              )}
              {isEditing ? "Update" : "Create"} Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
