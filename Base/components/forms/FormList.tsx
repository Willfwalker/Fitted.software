"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  ExternalLink,
  ClipboardList,
  Archive,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Form, FormStatus } from "@/lib/types/forms"
import { FORM_STATUSES } from "@/lib/types/forms"
import { createForm, deleteForm, archiveForm } from "@/lib/actions/forms"

interface FormListProps {
  forms: Form[]
}

export function FormList({ forms }: FormListProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<FormStatus | "ALL">("ALL")
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const filtered = forms.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(search.toLowerCase()))
    const matchesStatus = statusFilter === "ALL" || f.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreate = () => {
    setError("")
    startTransition(async () => {
      const result = await createForm({ name, description })
      if (result.error) {
        setError(result.error)
        return
      }
      setShowCreate(false)
      setName("")
      setDescription("")
      if (result.formId) {
        router.push(`/forms/${result.formId}`)
      } else {
        router.refresh()
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteForm(id)
      router.refresh()
    })
  }

  const handleArchive = (id: string) => {
    startTransition(async () => {
      await archiveForm(id)
      router.refresh()
    })
  }

  const getStatusColor = (status: FormStatus) => {
    return FORM_STATUSES.find((s) => s.value === status)?.color ?? "#8A817A"
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-dim)]" />
          <Input
            placeholder="Search forms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-dim)] text-[0.85rem]"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-0.5">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-md text-[0.78rem] transition-colors ${
                statusFilter === "ALL"
                  ? "bg-[rgba(212,115,78,0.1)] text-[var(--accent)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              All
            </button>
            {FORM_STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={`px-3 py-1.5 rounded-md text-[0.78rem] transition-colors ${
                  statusFilter === s.value
                    ? "bg-[rgba(212,115,78,0.1)] text-[var(--accent)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <Button
            onClick={() => setShowCreate(true)}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-5 text-[0.82rem]"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Form
          </Button>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ClipboardList className="h-10 w-10 text-[var(--text-dim)] mb-4" strokeWidth={1.2} />
          <p className="text-[var(--text-muted)] text-[0.9rem] font-light mb-1">
            {search || statusFilter !== "ALL" ? "No forms match your filters" : "No forms yet"}
          </p>
          <p className="text-[var(--text-dim)] text-[0.82rem] font-light mb-4">
            Create a form to start collecting data
          </p>
          {!search && statusFilter === "ALL" && (
            <Button
              onClick={() => setShowCreate(true)}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-5 text-[0.82rem]"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Create Form
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((form) => (
            <Link
              key={form.id}
              href={`/forms/${form.id}`}
              className="group rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 hover:border-[var(--accent)] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: getStatusColor(form.status) }}
                  />
                  <span
                    className="text-[0.7rem] font-medium uppercase tracking-wider"
                    style={{ color: getStatusColor(form.status) }}
                  >
                    {form.status}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.preventDefault()}
                      className="p-1 rounded-md text-[var(--text-dim)] hover:text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-[var(--bg-elevated)] border-[var(--border)]"
                  >
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault()
                        router.push(`/forms/${form.id}`)
                      }}
                      className="text-[var(--text-muted)] focus:text-[var(--text)] focus:bg-[rgba(232,224,212,0.03)]"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault()
                        router.push(`/forms/${form.id}/submissions`)
                      }}
                      className="text-[var(--text-muted)] focus:text-[var(--text)] focus:bg-[rgba(232,224,212,0.03)]"
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-2" />
                      Submissions
                    </DropdownMenuItem>
                    {form.status !== "ARCHIVED" && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault()
                          handleArchive(form.id)
                        }}
                        className="text-[var(--text-muted)] focus:text-[var(--text)] focus:bg-[rgba(232,224,212,0.03)]"
                      >
                        <Archive className="h-3.5 w-3.5 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault()
                        handleDelete(form.id)
                      }}
                      className="text-[#EF5B5B] focus:text-[#EF5B5B] focus:bg-[rgba(239,91,91,0.05)]"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <h3 className="text-[0.95rem] text-[var(--text)] font-light mb-1 truncate">
                {form.name}
              </h3>
              {form.description && (
                <p className="text-[0.82rem] text-[var(--text-muted)] font-light line-clamp-2 mb-3">
                  {form.description}
                </p>
              )}

              <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border)]">
                <span className="text-[0.75rem] text-[var(--text-dim)]">
                  {form.fields.length} field{form.fields.length !== 1 ? "s" : ""}
                </span>
                <span className="text-[0.75rem] text-[var(--text-dim)]">
                  {form.submission_count} submission{form.submission_count !== 1 ? "s" : ""}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[var(--bg-elevated)] border-[var(--border)] sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-[var(--text)] font-light text-[1.1rem]">
              Create Form
            </DialogTitle>
            <DialogDescription className="text-[var(--text-dim)] text-[0.82rem]">
              Start with a name, then add fields in the builder.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-[var(--text-muted)] text-[0.78rem]">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Contact Request"
                className="mt-1.5 bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-dim)]"
              />
            </div>
            <div>
              <Label className="text-[var(--text-muted)] text-[0.78rem]">Description (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this form for?"
                rows={3}
                className="mt-1.5 bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-dim)] resize-none"
              />
            </div>
          </div>

          {error && (
            <p className="text-[0.82rem] text-[#EF5B5B]">{error}</p>
          )}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowCreate(false)}
              className="text-[var(--text-muted)]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isPending || !name.trim()}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-5"
            >
              {isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
