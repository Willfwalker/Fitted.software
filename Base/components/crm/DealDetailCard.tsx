"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Pencil, Calendar, User, Building2, Receipt, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DealForm } from "./DealForm"
import { DeleteConfirmDialog } from "./DeleteConfirmDialog"
import { deleteDeal } from "@/lib/actions/deals"
import type { Deal } from "@/lib/types/crm"
import { DEAL_STAGES, PRIORITY_CONFIG } from "@/lib/types/crm"

interface DealDetailCardProps {
  deal: Deal
  contacts: { id: string; first_name: string; last_name: string }[]
  companies: { id: string; name: string }[]
}

export function DealDetailCard({ deal, contacts, companies }: DealDetailCardProps) {
  const router = useRouter()
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [isDeleting, startDelete] = useTransition()

  const handleDelete = () => {
    startDelete(async () => {
      const result = await deleteDeal(deal.id)
      if (result.error) {
        alert(result.error)
        return
      }
      setShowDelete(false)
      router.push("/crm/deals")
    })
  }

  const stageConfig = DEAL_STAGES.find((s) => s.value === deal.stage)
  const priorityConfig = PRIORITY_CONFIG[deal.priority]

  return (
    <>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-7 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="font-[family-name:var(--font-display)] text-[1.8rem] text-[var(--text)] tracking-tight leading-tight">
              {deal.title}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              {stageConfig && (
                <Badge
                  variant="outline"
                  className="text-[0.72rem] px-2.5 py-0.5 border-0 font-medium"
                  style={{ color: stageConfig.color, backgroundColor: `${stageConfig.color}15` }}
                >
                  {stageConfig.label}
                </Badge>
              )}
              <Badge
                variant="outline"
                className="text-[0.72rem] px-2.5 py-0.5 border-0 font-medium"
                style={{ color: priorityConfig.color, backgroundColor: `${priorityConfig.color}15` }}
              >
                {priorityConfig.label} Priority
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/invoicing/new?deal_id=${deal.id}`}>
              <Button
                variant="ghost"
                className="text-[var(--text-dim)] hover:text-[var(--text)] text-[0.82rem]"
              >
                <Receipt className="h-4 w-4 mr-1.5" />
                Create Invoice
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowEdit(true)}
              className="text-[var(--text-dim)] hover:text-[var(--text)]"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDelete(true)}
              disabled={isDeleting}
              className="text-[var(--text-dim)] hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Value */}
        {deal.value != null && (
          <div>
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)] mb-1">
              Deal Value
            </p>
            <p className="font-[family-name:var(--font-display)] text-[2.2rem] text-[var(--text)] leading-none tracking-tight">
              ${Number(deal.value).toLocaleString()}
            </p>
          </div>
        )}

        {/* Detail grid */}
        <div className="grid grid-cols-2 gap-4">
          {deal.contact && (
            <div className="rounded-xl border border-[var(--border)] p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <User className="h-3.5 w-3.5 text-[var(--text-dim)]" strokeWidth={1.8} />
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
                  Contact
                </p>
              </div>
              <p className="text-[0.88rem] text-[var(--text)] font-light">
                {deal.contact.first_name} {deal.contact.last_name}
              </p>
              {(deal.contact as { email?: string | null }).email && (
                <p className="text-[0.78rem] text-[var(--text-muted)] font-light mt-0.5">
                  {(deal.contact as { email?: string | null }).email}
                </p>
              )}
            </div>
          )}

          {deal.company && (
            <div className="rounded-xl border border-[var(--border)] p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Building2 className="h-3.5 w-3.5 text-[var(--text-dim)]" strokeWidth={1.8} />
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
                  Company
                </p>
              </div>
              <p className="text-[0.88rem] text-[var(--text)] font-light">
                {deal.company.name}
              </p>
            </div>
          )}

          {deal.expected_close_date && (
            <div className="rounded-xl border border-[var(--border)] p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Calendar className="h-3.5 w-3.5 text-[var(--text-dim)]" strokeWidth={1.8} />
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
                  Expected Close
                </p>
              </div>
              <p className="text-[0.88rem] text-[var(--text)] font-light">
                {new Date(deal.expected_close_date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          )}

          {deal.closed_at && (
            <div className="rounded-xl border border-[var(--border)] p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Calendar className="h-3.5 w-3.5 text-[var(--text-dim)]" strokeWidth={1.8} />
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
                  Closed
                </p>
              </div>
              <p className="text-[0.88rem] text-[var(--text)] font-light">
                {new Date(deal.closed_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          )}
        </div>

        {/* Notes */}
        {deal.notes && (
          <div>
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)] mb-2">
              Notes
            </p>
            <p className="text-[0.85rem] text-[var(--text-muted)] font-light whitespace-pre-wrap">
              {deal.notes}
            </p>
          </div>
        )}

      </div>

      {/* Edit Dialog */}
      <DealForm
        open={showEdit}
        onOpenChange={setShowEdit}
        contacts={contacts}
        companies={companies}
        deal={deal}
      />

      <DeleteConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        onConfirm={handleDelete}
        title="Delete deal?"
        description={`This will permanently delete "${deal.title}" and all its activity. This cannot be undone.`}
      />
    </>
  )
}
