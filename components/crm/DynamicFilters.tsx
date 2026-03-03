"use client"

import { useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import type { FilterDef } from "@/lib/types/ui-config"

interface DynamicFiltersProps {
  filters: FilterDef[]
  basePath: string
}

export function DynamicFilters({ filters, basePath }: DynamicFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [textInputs, setTextInputs] = useState<Record<string, string>>({})

  const updateParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "__all__") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${basePath}${params.toString() ? `?${params}` : ""}`)
  }, [router, searchParams, basePath])

  const clearAllFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    for (const filter of filters) {
      params.delete(`filter_${filter.key}`)
      if (filter.type === "date-range") {
        params.delete(`filter_${filter.key}_from`)
        params.delete(`filter_${filter.key}_to`)
      }
    }
    router.push(`${basePath}${params.toString() ? `?${params}` : ""}`)
  }, [router, searchParams, basePath, filters])

  if (filters.length === 0) return null

  // Count active filters
  const activeCount = filters.reduce((count, filter) => {
    if (filter.type === "date-range") {
      const hasFrom = searchParams.has(`filter_${filter.key}_from`)
      const hasTo = searchParams.has(`filter_${filter.key}_to`)
      return count + (hasFrom || hasTo ? 1 : 0)
    }
    return count + (searchParams.has(`filter_${filter.key}`) ? 1 : 0)
  }, 0)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={`text-[0.82rem] gap-1.5 ${
            activeCount > 0
              ? "text-[var(--accent)] hover:text-[var(--accent)]"
              : "text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          Filter
          {activeCount > 0 && (
            <span className="ml-0.5 min-w-[18px] h-[18px] rounded-full bg-[var(--accent)] text-[var(--bg)] text-[0.68rem] font-medium inline-flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[280px] bg-[var(--bg-elevated)] border-[var(--border)] p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <span className="text-[0.82rem] text-[var(--text)] font-light">Filters</span>
          {activeCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-[0.75rem] text-[var(--accent)] hover:text-[var(--accent-hover)] font-light transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Filter controls */}
        <div className="p-4 space-y-4">
          {filters.map((filter) => {
            if (filter.type === "select") {
              const paramKey = `filter_${filter.key}`
              const current = searchParams.get(paramKey) || "__all__"
              return (
                <div key={filter.key} className="space-y-1.5">
                  <label className="text-[0.75rem] text-[var(--text-muted)] font-medium uppercase tracking-wider">
                    {filter.label}
                  </label>
                  <Select value={current} onValueChange={(v) => updateParam(paramKey, v)}>
                    <SelectTrigger className="w-full bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] text-[0.82rem]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                      <SelectItem value="__all__" className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">
                        All
                      </SelectItem>
                      {filter.options?.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )
            }

            if (filter.type === "text") {
              const paramKey = `filter_${filter.key}`
              const currentValue = textInputs[filter.key] ?? searchParams.get(paramKey) ?? ""
              return (
                <div key={filter.key} className="space-y-1.5">
                  <label className="text-[0.75rem] text-[var(--text-muted)] font-medium uppercase tracking-wider">
                    {filter.label}
                  </label>
                  <div className="relative">
                    <Input
                      placeholder={`Search ${filter.label.toLowerCase()}...`}
                      value={currentValue}
                      onChange={(e) => {
                        setTextInputs((prev) => ({ ...prev, [filter.key]: e.target.value }))
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          updateParam(paramKey, currentValue || null)
                        }
                      }}
                      onBlur={() => updateParam(paramKey, currentValue || null)}
                      className="w-full bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-dim)] text-[0.82rem] pr-8"
                    />
                    {currentValue && (
                      <button
                        onClick={() => {
                          setTextInputs((prev) => ({ ...prev, [filter.key]: "" }))
                          updateParam(paramKey, null)
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text-muted)]"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            }

            if (filter.type === "date-range") {
              const fromKey = `filter_${filter.key}_from`
              const toKey = `filter_${filter.key}_to`
              return (
                <div key={filter.key} className="space-y-1.5">
                  <label className="text-[0.75rem] text-[var(--text-muted)] font-medium uppercase tracking-wider">
                    {filter.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={searchParams.get(fromKey) || ""}
                      onChange={(e) => updateParam(fromKey, e.target.value || null)}
                      className="flex-1 bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] text-[0.82rem]"
                    />
                    <span className="text-[0.75rem] text-[var(--text-dim)] shrink-0">to</span>
                    <Input
                      type="date"
                      value={searchParams.get(toKey) || ""}
                      onChange={(e) => updateParam(toKey, e.target.value || null)}
                      className="flex-1 bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] text-[0.82rem]"
                    />
                  </div>
                </div>
              )
            }

            if (filter.type === "boolean") {
              const paramKey = `filter_${filter.key}`
              const current = searchParams.get(paramKey)
              return (
                <div key={filter.key} className="flex items-center justify-between">
                  <label className="text-[0.75rem] text-[var(--text-muted)] font-medium uppercase tracking-wider">
                    {filter.label}
                  </label>
                  <button
                    onClick={() => updateParam(paramKey, current === "true" ? null : "true")}
                    className={`w-9 h-5 rounded-full transition-colors relative ${
                      current === "true"
                        ? "bg-[var(--accent)]"
                        : "bg-[var(--border)]"
                    }`}
                  >
                    <span
                      className={`block w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-transform ${
                        current === "true" ? "translate-x-[18px]" : "translate-x-[3px]"
                      }`}
                    />
                  </button>
                </div>
              )
            }

            return null
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
