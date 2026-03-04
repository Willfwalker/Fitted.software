"use client"

import { useActionState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createContact, updateContact, type ContactActionState } from "@/lib/actions/contacts"
import type { Contact } from "@/lib/types/crm"

interface ContactFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companies: { id: string; name: string }[]
  contact?: Contact
}

export function ContactForm({ open, onOpenChange, companies, contact }: ContactFormProps) {
  const isEdit = !!contact

  const action = isEdit
    ? updateContact.bind(null, contact.id)
    : createContact

  const [state, formAction, isPending] = useActionState<ContactActionState, FormData>(action, {})

  useEffect(() => {
    if (state.success) {
      onOpenChange(false)
    }
  }, [state.success, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-display)] text-[1.3rem] text-[var(--text)]">
            {isEdit ? "Edit Contact" : "Add Contact"}
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[0.78rem] text-[var(--text-muted)]">First Name *</Label>
              <Input
                name="first_name"
                defaultValue={contact?.first_name ?? ""}
                required
                className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[0.78rem] text-[var(--text-muted)]">Last Name *</Label>
              <Input
                name="last_name"
                defaultValue={contact?.last_name ?? ""}
                required
                className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Email</Label>
            <Input
              name="email"
              type="email"
              defaultValue={contact?.email ?? ""}
              className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[0.78rem] text-[var(--text-muted)]">Phone</Label>
              <Input
                name="phone"
                defaultValue={contact?.phone ?? ""}
                className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[0.78rem] text-[var(--text-muted)]">Title</Label>
              <Input
                name="title"
                defaultValue={contact?.title ?? ""}
                className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Company</Label>
            <Select name="company_id" defaultValue={contact?.company_id ?? ""}>
              <SelectTrigger className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]">
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Notes</Label>
            <Textarea
              name="notes"
              defaultValue={contact?.notes ?? ""}
              rows={3}
              className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] resize-none"
            />
          </div>

          {state.error && (
            <p className="text-[0.82rem] text-red-400">{state.error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-6"
            >
              {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Contact"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
