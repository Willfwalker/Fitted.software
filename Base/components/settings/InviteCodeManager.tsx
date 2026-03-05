"use client"

import { useState } from "react"
import { Plus, Trash2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DeleteConfirmDialog } from "@/components/crm/DeleteConfirmDialog"
import { createInviteCode, deleteInviteCode } from "@/lib/actions/invites"

interface InviteCode {
  id: string
  code: string
  max_uses: number
  use_count: number
  expires_at: string | null
  created_at: string
}

interface InviteCodeManagerProps {
  inviteCodes: InviteCode[]
}

export function InviteCodeManager({ inviteCodes }: InviteCodeManagerProps) {
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<InviteCode | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function handleCreate() {
    setCreating(true)
    setError("")
    const result = await createInviteCode()
    setCreating(false)
    if (result.error) setError(result.error)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteInviteCode(deleteTarget.id)
    setDeleteTarget(null)
  }

  function handleCopy(code: string, id: string) {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[0.82rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
          Invite Codes
        </h3>
        <Button
          variant="ghost"
          onClick={handleCreate}
          disabled={creating}
          className="text-[var(--text-muted)] hover:text-[var(--text)] text-[0.82rem]"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          {creating ? "..." : "Generate Code"}
        </Button>
      </div>

      {error && <p className="text-[0.82rem] text-red-400">{error}</p>}

      {inviteCodes.length === 0 ? (
        <p className="text-[0.85rem] text-[var(--text-dim)] font-light">
          No invite codes yet. Generate one to invite team members.
        </p>
      ) : (
        <div className="space-y-1">
          {inviteCodes.map((ic) => (
            <div key={ic.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg group hover:bg-[var(--bg)]">
              <div className="flex items-center gap-3">
                <code className="text-[0.85rem] font-mono text-[var(--text)] tracking-wider">
                  {ic.code}
                </code>
                <span className="text-[0.75rem] text-[var(--text-dim)]">
                  {ic.use_count}/{ic.max_uses} uses
                </span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopy(ic.code, ic.id)}
                  className="h-7 w-7 text-[var(--text-dim)] hover:text-[var(--text)]"
                >
                  {copiedId === ic.id ? (
                    <Check className="h-3 w-3 text-green-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteTarget(ic)}
                  className="h-7 w-7 text-[var(--text-dim)] hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        onConfirm={handleDelete}
        title="Delete Invite Code"
        description={`Are you sure you want to delete the invite code "${deleteTarget?.code}"? It will no longer be usable.`}
      />
    </div>
  )
}
