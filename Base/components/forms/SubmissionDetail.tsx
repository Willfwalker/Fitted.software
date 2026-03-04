"use client"

import type { FormSubmission } from "@/lib/types/forms"

interface SubmissionDetailProps {
  submission: FormSubmission
  getFieldLabel: (fieldId: string) => string
}

export function SubmissionDetail({ submission, getFieldLabel }: SubmissionDetailProps) {
  return (
    <div className="space-y-4 py-2">
      {/* Data fields */}
      <div className="space-y-3">
        {Object.entries(submission.data).map(([key, value]) => {
          const display = Array.isArray(value) ? value.join(", ") : String(value ?? "—")
          return (
            <div key={key}>
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)] mb-0.5">
                {getFieldLabel(key)}
              </p>
              <p className="text-[0.88rem] text-[var(--text)] font-light whitespace-pre-wrap">
                {display}
              </p>
            </div>
          )
        })}
      </div>

      {/* Linked entities */}
      {(submission.contact || submission.company || submission.deal) && (
        <div className="border-t border-[var(--border)] pt-4 space-y-2">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
            Linked Entities
          </p>
          {submission.contact && (
            <div className="flex justify-between text-[0.82rem]">
              <span className="text-[var(--text-muted)] font-light">Contact</span>
              <span className="text-[var(--text)]">
                {submission.contact.first_name} {submission.contact.last_name}
              </span>
            </div>
          )}
          {submission.company && (
            <div className="flex justify-between text-[0.82rem]">
              <span className="text-[var(--text-muted)] font-light">Company</span>
              <span className="text-[var(--text)]">{submission.company.name}</span>
            </div>
          )}
          {submission.deal && (
            <div className="flex justify-between text-[0.82rem]">
              <span className="text-[var(--text-muted)] font-light">Deal</span>
              <span className="text-[var(--text)]">{submission.deal.title}</span>
            </div>
          )}
        </div>
      )}

      {/* Meta */}
      <div className="border-t border-[var(--border)] pt-4 space-y-2">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
          Metadata
        </p>
        <div className="flex justify-between text-[0.82rem]">
          <span className="text-[var(--text-muted)] font-light">Submitted</span>
          <span className="text-[var(--text)]">
            {new Date(submission.created_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>
        {submission.source_ip && (
          <div className="flex justify-between text-[0.82rem]">
            <span className="text-[var(--text-muted)] font-light">IP</span>
            <span className="text-[var(--text)]">{submission.source_ip}</span>
          </div>
        )}
      </div>
    </div>
  )
}
