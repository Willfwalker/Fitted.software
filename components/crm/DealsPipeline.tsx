"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PipelineColumn } from "./PipelineColumn"
import { DealForm } from "./DealForm"
import { EmptyState } from "./EmptyState"
import { DynamicFilters } from "./DynamicFilters"
import { moveDealStage } from "@/lib/actions/deals"
import type { Deal, DealStage, DealPriority } from "@/lib/types/crm"
import { DEAL_STAGES, ACTIVE_STAGES, CLOSED_STAGES } from "@/lib/types/crm"
import type { UiConfig } from "@/lib/types/ui-config"

interface DealsPipelineProps {
  deals: Deal[]
  contacts: { id: string; first_name: string; last_name: string }[]
  companies: { id: string; name: string }[]
  uiConfig?: UiConfig
}

export function DealsPipeline({ deals: initialDeals, contacts, companies, uiConfig }: DealsPipelineProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [deals, setDeals] = useState(initialDeals)
  const [showCreate, setShowCreate] = useState(false)

  // Auto-open create dialog from ?create=true
  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setShowCreate(true)
      router.replace("/dashboard/crm/deals")
    }
  }, [searchParams, router])
  const [showClosed, setShowClosed] = useState(false)
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null)
  const [priorityFilter, setPriorityFilter] = useState<DealPriority | "ALL">("ALL")

  // Filter deals by priority
  const filteredDeals = priorityFilter === "ALL"
    ? deals
    : deals.filter((d) => d.priority === priorityFilter)

  // Group deals by stage
  const dealsByStage = DEAL_STAGES.reduce((acc, stage) => {
    acc[stage.value] = filteredDeals.filter((d) => d.stage === stage.value)
    return acc
  }, {} as Record<DealStage, Deal[]>)

  const handleDragStart = useCallback((dealId: string) => {
    setDraggedDealId(dealId)
  }, [])

  const handleDrop = useCallback(
    async (targetStage: DealStage) => {
      if (!draggedDealId) return

      const deal = deals.find((d) => d.id === draggedDealId)
      if (!deal || deal.stage === targetStage) {
        setDraggedDealId(null)
        return
      }

      // Optimistic update
      const newPosition = dealsByStage[targetStage].length
      setDeals((prev) =>
        prev.map((d) =>
          d.id === draggedDealId
            ? { ...d, stage: targetStage, position: newPosition }
            : d
        )
      )
      setDraggedDealId(null)

      // Server update
      const result = await moveDealStage(draggedDealId, targetStage, newPosition)
      if (result.error) {
        // Revert on error
        setDeals(initialDeals)
      } else {
        router.refresh()
      }
    },
    [draggedDealId, deals, dealsByStage, initialDeals, router]
  )

  const closedDeals = [...dealsByStage.WON, ...dealsByStage.LOST]
  const hasDeals = deals.length > 0

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <p className="text-[0.85rem] text-[var(--text-muted)] font-light">
            {filteredDeals.length} deal{filteredDeals.length !== 1 ? "s" : ""}
            {filteredDeals.length > 0 && (
              <span className="ml-2 text-[var(--text-dim)]">
                &middot; ${filteredDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0).toLocaleString()} total
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-5"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Deal
        </Button>
      </div>

      {/* Priority filter + dynamic filters */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPriorityFilter(p)}
            className={`px-3 py-1.5 rounded-full text-[0.78rem] font-light transition-colors ${
              priorityFilter === p
                ? "bg-[rgba(212,115,78,0.12)] text-[var(--text)]"
                : "text-[var(--text-dim)] hover:text-[var(--text-muted)] hover:bg-[rgba(232,224,212,0.03)]"
            }`}
          >
            {p === "ALL" ? "All" : p === "HIGH" ? "High" : p === "MEDIUM" ? "Medium" : "Low"}
          </button>
        ))}
        {uiConfig?.filters && uiConfig.filters.length > 0 && (
          <DynamicFilters filters={uiConfig.filters} basePath="/dashboard/crm/deals" />
        )}
      </div>

      {!hasDeals ? (
        <EmptyState
          icon="Briefcase"
          title="No deals yet"
          description="Create your first deal to start tracking your pipeline."
          actionLabel="Add Deal"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <>
          {/* Active pipeline columns */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {ACTIVE_STAGES.map((stage) => {
              const config = DEAL_STAGES.find((s) => s.value === stage)!
              return (
                <PipelineColumn
                  key={stage}
                  stage={stage}
                  label={config.label}
                  color={config.color}
                  deals={dealsByStage[stage]}
                  isDragOver={false}
                  onDragStart={handleDragStart}
                  onDrop={() => handleDrop(stage)}
                  onDealClick={(deal) => router.push(`/dashboard/crm/deals/${deal.id}`)}
                />
              )
            })}
          </div>

          {/* Closed deals (collapsible) */}
          {closedDeals.length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setShowClosed(!showClosed)}
                className="flex items-center gap-2 text-[0.82rem] text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors font-light mb-3"
              >
                {showClosed ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
                Closed ({closedDeals.length})
              </button>
              {showClosed && (
                <div className="grid grid-cols-2 gap-3">
                  {CLOSED_STAGES.map((stage) => {
                    const config = DEAL_STAGES.find((s) => s.value === stage)!
                    return (
                      <PipelineColumn
                        key={stage}
                        stage={stage}
                        label={config.label}
                        color={config.color}
                        deals={dealsByStage[stage]}
                        isDragOver={false}
                        onDragStart={handleDragStart}
                        onDrop={() => handleDrop(stage)}
                        onDealClick={(deal) => router.push(`/dashboard/crm/deals/${deal.id}`)}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Create Dialog */}
      <DealForm
        open={showCreate}
        onOpenChange={setShowCreate}
        contacts={contacts}
        companies={companies}
        uiConfig={uiConfig}
      />

    </>
  )
}
