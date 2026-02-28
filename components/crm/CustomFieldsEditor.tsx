"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Loader2, Sparkles, Trash2, Plus, ArrowLeft, Undo2,
  Users, Building2, Briefcase, FileText, BarChart3, LayoutDashboard,
  Filter, Columns3, ArrowUpDown,
} from "lucide-react"
import { updateUiConfig } from "@/lib/actions/ui-config"
import type { UiConfig, EntityType } from "@/lib/types/ui-config"

const SECTIONS: { value: EntityType; label: string; icon: typeof Users }[] = [
  { value: "contacts", label: "Contacts", icon: Users },
  { value: "companies", label: "Companies", icon: Building2 },
  { value: "deals", label: "Deals", icon: Briefcase },
  { value: "invoices", label: "Invoices", icon: FileText },
  { value: "reports", label: "Reports", icon: BarChart3 },
  { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
]

interface CustomFieldsEditorProps {
  initialConfigs: Record<EntityType, UiConfig>
}

interface UndoEntry {
  entity: EntityType
  config: UiConfig
  label: string
}

function configItemCount(config: UiConfig): number {
  return (
    config.fields.length +
    (config.filters?.length ?? 0) +
    (config.columns?.length ?? 0) +
    (config.sorts?.length ?? 0)
  )
}

export function CustomFieldsEditor({ initialConfigs }: CustomFieldsEditorProps) {
  const [configs, setConfigs] = useState(initialConfigs)
  const [step, setStep] = useState<"idle" | "pick" | "input">("idle")
  const [activeEntity, setActiveEntity] = useState<EntityType | null>(null)
  const [request, setRequest] = useState("")
  const [loading, setLoading] = useState(false)
  const [undoing, setUndoing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([])
  const [undoToast, setUndoToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false })

  // Auto-dismiss undo toast after 8 seconds
  useEffect(() => {
    if (!undoToast.visible) return
    const timer = setTimeout(() => {
      setUndoToast((prev) => ({ ...prev, visible: false }))
    }, 8000)
    return () => clearTimeout(timer)
  }, [undoToast.visible])

  function handlePickSection(entity: EntityType) {
    setActiveEntity(entity)
    setStep("input")
    setError(null)
    setRequest("")
  }

  function handleCancel() {
    setStep("idle")
    setActiveEntity(null)
    setRequest("")
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!request.trim() || !activeEntity) return
    await sendRequest(activeEntity, request.trim())
  }

  async function handleRemoveItem(entity: EntityType, type: string, key: string) {
    await sendRequest(entity, `Remove the ${type} with key "${key}"`)
  }

  async function sendRequest(entity: EntityType, userRequest: string) {
    setLoading(true)
    setError(null)

    // Snapshot current config before the AI changes it
    const previousConfig = configs[entity]

    try {
      const res = await fetch("/api/ui-config/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: entity,
          userRequest,
          currentConfig: previousConfig,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Something went wrong")
        return
      }

      // Push undo entry
      setUndoStack((prev) => [...prev, { entity, config: previousConfig, label: data.message || userRequest }])
      setUndoToast({ message: data.message || "Done.", visible: true })

      setConfigs((prev) => ({ ...prev, [entity]: data.config }))
      setRequest("")
      setStep("idle")
      setActiveEntity(null)
    } catch {
      setError("Failed to update")
    } finally {
      setLoading(false)
    }
  }

  const handleUndo = useCallback(async () => {
    if (undoStack.length === 0 || undoing) return

    setUndoing(true)
    const entry = undoStack[undoStack.length - 1]

    try {
      await updateUiConfig(entry.entity, entry.config)
      setConfigs((prev) => ({ ...prev, [entry.entity]: entry.config }))
      setUndoStack((prev) => prev.slice(0, -1))
      setUndoToast({ message: "", visible: false })
    } catch {
      setError("Failed to undo")
    } finally {
      setUndoing(false)
    }
  }, [undoStack, undoing])

  const totalItems = Object.values(configs).reduce((sum, c) => sum + configItemCount(c), 0)

  return (
    <div className="space-y-6">
      {/* Header row */}
      {step === "idle" && (
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setStep("pick")}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-5"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add a Feature
          </Button>
          {undoStack.length > 0 && (
            <Button
              variant="ghost"
              onClick={handleUndo}
              disabled={undoing}
              className="text-[var(--text-muted)] hover:text-[var(--text)] text-[0.82rem] gap-1.5"
            >
              {undoing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Undo2 className="h-3.5 w-3.5" />
              )}
              Undo
              <span className="text-[var(--text-dim)] text-[0.75rem]">
                ({undoStack.length})
              </span>
            </Button>
          )}
        </div>
      )}

      {/* Step 1: Pick section */}
      {step === "pick" && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[0.88rem] text-[var(--text)] font-light">Which section?</p>
            <button
              onClick={handleCancel}
              className="text-[0.78rem] text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {SECTIONS.map((s) => {
              const Icon = s.icon
              const count = configItemCount(configs[s.value])
              return (
                <button
                  key={s.value}
                  onClick={() => handlePickSection(s.value)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[rgba(212,115,78,0.04)] transition-all cursor-pointer"
                >
                  <Icon className="h-5 w-5 text-[var(--text-muted)]" strokeWidth={1.5} />
                  <span className="text-[0.85rem] text-[var(--text)] font-light">{s.label}</span>
                  {count > 0 && (
                    <span className="text-[0.7rem] text-[var(--text-dim)]">
                      {count} item{count !== 1 ? "s" : ""}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Step 2: Natural language input */}
      {step === "input" && activeEntity && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5 space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep("pick")}
              className="text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <p className="text-[0.88rem] text-[var(--text)] font-light">
              Add to <span className="text-[var(--accent)] font-medium capitalize">{activeEntity}</span>
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder='e.g. "Add a timezone field with US options"'
              disabled={loading}
              autoFocus
              className="flex-1 bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)]"
            />
            <Button
              type="submit"
              disabled={loading || !request.trim()}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-5"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span className="ml-1.5">{loading ? "Working..." : "Go"}</span>
            </Button>
          </form>
          {error && (
            <div className="text-[0.82rem] text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Existing items grouped by section */}
      {totalItems > 0 ? (
        <div className="space-y-4">
          {SECTIONS.map((s) => {
            const config = configs[s.value]
            const count = configItemCount(config)
            if (count === 0) return null
            const Icon = s.icon

            return (
              <div key={s.value} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-[var(--border)]">
                  <Icon className="h-3.5 w-3.5 text-[var(--text-dim)]" strokeWidth={1.5} />
                  <span className="text-[0.78rem] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                    {s.label}
                  </span>
                  <span className="text-[0.72rem] text-[var(--text-dim)] ml-auto">
                    {count} item{count !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {/* Fields */}
                  {config.fields.map((field) => (
                    <div
                      key={`field-${field.key}`}
                      className="flex items-center justify-between px-5 py-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-3 w-3 text-[var(--text-dim)]" />
                          <span className="text-[0.85rem] text-[var(--text)] font-light">{field.label}</span>
                          <span className="text-[0.7rem] text-[var(--text-dim)] bg-[var(--bg)] rounded px-1.5 py-0.5">
                            field &middot; {field.type}
                          </span>
                          {field.required && (
                            <span className="text-[0.7rem] text-[var(--accent)]">required</span>
                          )}
                        </div>
                        <div className="text-[0.72rem] text-[var(--text-dim)] font-mono ml-5">
                          {field.key}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(s.value, "field", field.key)}
                        disabled={loading}
                        className="h-8 w-8 p-0 text-[var(--text-dim)] hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}

                  {/* Filters */}
                  {config.filters?.map((filter) => (
                    <div
                      key={`filter-${filter.key}`}
                      className="flex items-center justify-between px-5 py-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Filter className="h-3 w-3 text-[var(--text-dim)]" />
                          <span className="text-[0.85rem] text-[var(--text)] font-light">{filter.label}</span>
                          <span className="text-[0.7rem] text-[var(--text-dim)] bg-[var(--bg)] rounded px-1.5 py-0.5">
                            filter &middot; {filter.type}
                          </span>
                        </div>
                        <div className="text-[0.72rem] text-[var(--text-dim)] font-mono ml-5">
                          {filter.column}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(s.value, "filter", filter.key)}
                        disabled={loading}
                        className="h-8 w-8 p-0 text-[var(--text-dim)] hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}

                  {/* Columns */}
                  {config.columns?.map((col) => (
                    <div
                      key={`col-${col.key}`}
                      className="flex items-center justify-between px-5 py-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Columns3 className="h-3 w-3 text-[var(--text-dim)]" />
                          <span className="text-[0.85rem] text-[var(--text)] font-light">{col.label}</span>
                          <span className="text-[0.7rem] text-[var(--text-dim)] bg-[var(--bg)] rounded px-1.5 py-0.5">
                            column &middot; {col.source}
                          </span>
                          {!col.visible && (
                            <span className="text-[0.7rem] text-[var(--text-dim)]">hidden</span>
                          )}
                        </div>
                        <div className="text-[0.72rem] text-[var(--text-dim)] font-mono ml-5">
                          {col.column}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(s.value, "column", col.key)}
                        disabled={loading}
                        className="h-8 w-8 p-0 text-[var(--text-dim)] hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}

                  {/* Sorts */}
                  {config.sorts?.map((sort) => (
                    <div
                      key={`sort-${sort.key}`}
                      className="flex items-center justify-between px-5 py-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <ArrowUpDown className="h-3 w-3 text-[var(--text-dim)]" />
                          <span className="text-[0.85rem] text-[var(--text)] font-light">{sort.label}</span>
                          <span className="text-[0.7rem] text-[var(--text-dim)] bg-[var(--bg)] rounded px-1.5 py-0.5">
                            sort &middot; {sort.ascending ? "asc" : "desc"}
                          </span>
                        </div>
                        <div className="text-[0.72rem] text-[var(--text-dim)] font-mono ml-5">
                          {sort.column}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(s.value, "sort", sort.key)}
                        disabled={loading}
                        className="h-8 w-8 p-0 text-[var(--text-dim)] hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        step === "idle" && (
          <div className="text-center py-12 text-[var(--text-dim)] text-[0.88rem] font-light">
            No custom features yet. Click &quot;Add a Feature&quot; to get started.
          </div>
        )
      )}

      {/* Undo toast */}
      {undoToast.visible && undoStack.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-3 rounded-full bg-[var(--bg-card)] border border-[var(--border)] shadow-lg">
          <span className="text-[0.85rem] text-[var(--text)] font-light">
            {undoToast.message}
          </span>
          <Button
            onClick={handleUndo}
            disabled={undoing}
            variant="ghost"
            className="text-[var(--accent)] hover:text-[var(--accent-hover)] text-[0.82rem] gap-1.5 px-3 h-8"
          >
            {undoing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Undo2 className="h-3.5 w-3.5" />
            )}
            Undo
          </Button>
        </div>
      )}
    </div>
  )
}
