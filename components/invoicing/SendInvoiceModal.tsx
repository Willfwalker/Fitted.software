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
import { sendInvoiceEmail } from "@/lib/actions/invoices"

interface SendInvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceId: string
  invoiceNumber: string
  defaultEmail?: string | null
  defaultName?: string | null
}

export function SendInvoiceModal({
  open,
  onOpenChange,
  invoiceId,
  invoiceNumber,
  defaultEmail,
  defaultName,
}: SendInvoiceModalProps) {
  const [email, setEmail] = useState(defaultEmail ?? "")
  const [name, setName] = useState(defaultName ?? "")
  const [message, setMessage] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSend = () => {
    if (!email.trim()) {
      setError("Email is required")
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await sendInvoiceEmail({
        invoiceId,
        recipientEmail: email.trim(),
        recipientName: name.trim() || undefined,
        message: message.trim() || undefined,
      })
      if (result.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
        setMessage("")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-display)] text-[1.3rem] text-[var(--text)] tracking-tight">
            Send Invoice
          </DialogTitle>
          <DialogDescription className="text-[var(--text-muted)] text-[0.82rem]">
            Email {invoiceNumber} with a PDF attachment and a link to view it online.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
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

          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Message (optional)</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal note..."
              rows={3}
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
              Send Invoice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
