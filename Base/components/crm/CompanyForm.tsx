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
import { createCompany, updateCompany, type CompanyActionState } from "@/lib/actions/companies"
import type { Company } from "@/lib/types/crm"

interface CompanyFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  company?: Company
}

export function CompanyForm({ open, onOpenChange, company }: CompanyFormProps) {
  const isEdit = !!company

  const action = isEdit
    ? updateCompany.bind(null, company.id)
    : createCompany

  const [state, formAction, isPending] = useActionState<CompanyActionState, FormData>(action, {})

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
            {isEdit ? "Edit Company" : "Add Company"}
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Company Name *</Label>
            <Input
              name="name"
              defaultValue={company?.name ?? ""}
              required
              className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[0.78rem] text-[var(--text-muted)]">Domain</Label>
              <Input
                name="domain"
                placeholder="example.com"
                defaultValue={company?.domain ?? ""}
                className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[0.78rem] text-[var(--text-muted)]">Industry</Label>
              <Input
                name="industry"
                defaultValue={company?.industry ?? ""}
                className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[0.78rem] text-[var(--text-muted)]">Email</Label>
              <Input
                name="email"
                type="email"
                defaultValue={company?.email ?? ""}
                className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[0.78rem] text-[var(--text-muted)]">Phone</Label>
              <Input
                name="phone"
                defaultValue={company?.phone ?? ""}
                className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Address</Label>
            <Input
              name="address"
              defaultValue={company?.address ?? ""}
              className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Notes</Label>
            <Textarea
              name="notes"
              defaultValue={company?.notes ?? ""}
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
              {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Company"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
