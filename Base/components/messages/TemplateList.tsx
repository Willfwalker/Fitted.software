"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Search, Plus, FileText, Trash2, Pencil } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TemplateForm } from "./TemplateForm"
import { TemplatePreview } from "./TemplatePreview"
import { deleteTemplate } from "@/lib/actions/templates"
import type { MessageTemplate } from "@/lib/types/messaging"

interface TemplateListProps {
  templates: MessageTemplate[]
}

export function TemplateList({ templates }: TemplateListProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplate | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.subject?.toLowerCase().includes(search.toLowerCase()) ||
    t.body.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteTemplate(id)
      router.refresh()
    })
  }

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template)
    setFormOpen(true)
  }

  const handleCreate = () => {
    setEditingTemplate(null)
    setFormOpen(true)
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-dim)]" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-dim)]"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="ghost"
            onClick={() => router.push("/messages")}
            className="text-[var(--text-muted)] text-[0.82rem] cursor-pointer"
          >
            Messages
          </Button>
          <Button
            onClick={handleCreate}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-5 cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Template
          </Button>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-12 text-center">
          <FileText className="h-10 w-10 text-[var(--text-dim)] mx-auto mb-3" />
          <p className="text-[var(--text-muted)] text-[0.9rem] font-light mb-4">
            {search ? "No templates match your search" : "No templates yet"}
          </p>
          <Button
            onClick={handleCreate}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-5 cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((template) => (
            <div
              key={template.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-3 cursor-pointer hover:border-[var(--accent)] transition-colors group"
              onClick={() => setPreviewTemplate(template)}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[0.92rem] text-[var(--text)] font-light truncate">
                    {template.name}
                  </h3>
                  {template.subject && (
                    <p className="text-[0.78rem] text-[var(--text-muted)] font-light truncate mt-0.5">
                      {template.subject}
                    </p>
                  )}
                </div>
                <span className="text-[0.68rem] px-2 py-0.5 rounded-full bg-[rgba(212,115,78,0.1)] text-[var(--accent)] font-light shrink-0 ml-2">
                  {template.channel}
                </span>
              </div>

              <p className="text-[0.82rem] text-[var(--text-dim)] font-light line-clamp-3">
                {template.body}
              </p>

              {template.variables.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {template.variables.map((v) => (
                    <span
                      key={v}
                      className="text-[0.68rem] px-1.5 py-0.5 rounded bg-[var(--bg)] text-[var(--text-dim)] border border-[var(--border)]"
                    >
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-[0.72rem] text-[var(--text-dim)]">
                  {new Date(template.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(template) }}
                    className="p-1.5 rounded-md text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(template.id) }}
                    disabled={isPending}
                    className="p-1.5 rounded-md text-[var(--text-dim)] hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TemplateForm
        open={formOpen}
        onOpenChange={setFormOpen}
        template={editingTemplate}
      />

      {previewTemplate && (
        <TemplatePreview
          open={!!previewTemplate}
          onOpenChange={(o) => { if (!o) setPreviewTemplate(null) }}
          template={previewTemplate}
        />
      )}
    </>
  )
}
