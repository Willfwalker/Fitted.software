"use client"

import { useState, useTransition } from "react"
import { Send, Loader2 } from "lucide-react"
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
import { sendMessage } from "@/lib/actions/messages"
import type { Contact } from "@/lib/types/crm"
import { renderTemplate } from "@/lib/types/messaging"
import type { MessageTemplate } from "@/lib/types/messaging"

interface ComposeMessageProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contacts: Pick<Contact, "id" | "first_name" | "last_name" | "email">[]
  templates: MessageTemplate[]
  defaultContactId?: string
  defaultEmail?: string
  defaultName?: string
}

export function ComposeMessage({
  open,
  onOpenChange,
  contacts,
  templates,
  defaultContactId,
  defaultEmail,
  defaultName,
}: ComposeMessageProps) {
  const [email, setEmail] = useState(defaultEmail ?? "")
  const [name, setName] = useState(defaultName ?? "")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [contactId, setContactId] = useState(defaultContactId ?? "")
  const [templateId, setTemplateId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleContactChange = (id: string) => {
    setContactId(id)
    if (id) {
      const contact = contacts.find((c) => c.id === id)
      if (contact) {
        setEmail(contact.email || "")
        setName(`${contact.first_name} ${contact.last_name}`)
      }
    }
  }

  const handleTemplateChange = (id: string) => {
    setTemplateId(id)
    if (id) {
      const template = templates.find((t) => t.id === id)
      if (template) {
        setSubject(template.subject || "")
        // Pre-fill body with template, substituting known variables
        const values: Record<string, string> = {}
        if (name) values.name = name
        if (email) values.email = email
        setBody(renderTemplate(template.body, values))
      }
    }
  }

  const handleSend = () => {
    if (!email.trim()) {
      setError("Recipient email is required")
      return
    }
    if (!body.trim()) {
      setError("Message body is required")
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await sendMessage({
        subject: subject.trim() || undefined,
        body: body.trim(),
        recipient_email: email.trim(),
        recipient_name: name.trim() || undefined,
        contact_id: contactId || undefined,
        template_id: templateId || undefined,
      })
      if (result.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
        resetForm()
      }
    })
  }

  const resetForm = () => {
    if (!defaultEmail) setEmail("")
    if (!defaultName) setName("")
    if (!defaultContactId) setContactId("")
    setSubject("")
    setBody("")
    setTemplateId("")
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm() }}>
      <DialogContent className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-display)] text-[1.3rem] text-[var(--text)] tracking-tight">
            Compose Message
          </DialogTitle>
          <DialogDescription className="text-[var(--text-muted)] text-[0.82rem]">
            Send an email to a contact or any email address.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Template selector */}
          {templates.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-[0.78rem] text-[var(--text-muted)]">Template</Label>
              <Select value={templateId} onValueChange={handleTemplateChange}>
                <SelectTrigger className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.88rem]">
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-[var(--text)]">
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Contact picker */}
          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Contact</Label>
            <Select value={contactId} onValueChange={handleContactChange}>
              <SelectTrigger className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.88rem]">
                <SelectValue placeholder="Select a contact..." />
              </SelectTrigger>
              <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-[var(--text)]">
                    {c.first_name} {c.last_name} {c.email ? `(${c.email})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[0.78rem] text-[var(--text-muted)]">Recipient Email *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
                className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.88rem] focus-visible:ring-[var(--accent)]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[0.78rem] text-[var(--text-muted)]">Recipient Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.88rem] focus-visible:ring-[var(--accent)]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line..."
              className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.88rem] focus-visible:ring-[var(--accent)]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Message *</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              rows={6}
              className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.88rem] focus-visible:ring-[var(--accent)] resize-none"
            />
          </div>

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
              onClick={handleSend}
              disabled={isPending}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-full px-5 text-[0.82rem]"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5 mr-1.5" />
              )}
              Send Message
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
