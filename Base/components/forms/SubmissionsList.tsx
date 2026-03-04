"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trash2, Eye, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Form, FormSubmission, FormField } from "@/lib/types/forms"
import { deleteSubmission } from "@/lib/actions/submissions"
import { SubmissionDetail } from "./SubmissionDetail"

interface SubmissionsListProps {
  form: Form
  submissions: FormSubmission[]
}

export function SubmissionsList({ form, submissions }: SubmissionsListProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<FormSubmission | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteSubmission(id)
      router.refresh()
    })
  }

  const getFieldLabel = (fieldId: string): string => {
    const field = form.fields.find((f: FormField) => f.id === fieldId)
    return field?.label || fieldId
  }

  // Show up to 3 fields as table columns
  const visibleFields = form.fields
    .filter((f: FormField) => f.type !== "HIDDEN")
    .slice(0, 3)

  return (
    <>
      {/* Back link */}
      <Link
        href={`/forms/${form.id}`}
        className="flex items-center gap-1.5 text-[0.82rem] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Form
      </Link>

      {submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ClipboardList className="h-10 w-10 text-[var(--text-dim)] mb-4" strokeWidth={1.2} />
          <p className="text-[var(--text-muted)] text-[0.9rem] font-light mb-1">
            No submissions yet
          </p>
          <p className="text-[var(--text-dim)] text-[0.82rem] font-light">
            Share your form to start collecting responses
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
          {/* Table header */}
          <div className="grid gap-4 px-5 py-3 border-b border-[var(--border)]" style={{
            gridTemplateColumns: `repeat(${visibleFields.length}, 1fr) 140px 100px`,
          }}>
            {visibleFields.map((f: FormField) => (
              <span key={f.id} className="text-[0.75rem] text-[var(--text-muted)] font-medium uppercase tracking-wider">
                {f.label}
              </span>
            ))}
            <span className="text-[0.75rem] text-[var(--text-muted)] font-medium uppercase tracking-wider">
              Submitted
            </span>
            <span className="text-[0.75rem] text-[var(--text-muted)] font-medium uppercase tracking-wider text-right">
              Actions
            </span>
          </div>

          {/* Rows */}
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="grid gap-4 px-5 py-3 border-b border-[var(--border)] hover:bg-[rgba(232,224,212,0.02)] transition-colors items-center"
              style={{
                gridTemplateColumns: `repeat(${visibleFields.length}, 1fr) 140px 100px`,
              }}
            >
              {visibleFields.map((f: FormField) => {
                const val = sub.data[f.id]
                const display = Array.isArray(val) ? val.join(", ") : String(val ?? "—")
                return (
                  <span
                    key={f.id}
                    className="text-[0.85rem] text-[var(--text)] font-light truncate"
                  >
                    {display}
                  </span>
                )
              })}

              <span className="text-[0.82rem] text-[var(--text-muted)] font-light">
                {new Date(sub.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>

              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelected(sub)}
                  className="h-8 w-8 text-[var(--text-dim)] hover:text-[var(--text)]"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(sub.id)}
                  disabled={isPending}
                  className="h-8 w-8 text-[var(--text-dim)] hover:text-[#EF5B5B]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-[var(--bg-elevated)] border-[var(--border)] sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="text-[var(--text)] font-light text-[1.1rem]">
              Submission Details
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <SubmissionDetail
              submission={selected}
              getFieldLabel={getFieldLabel}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
