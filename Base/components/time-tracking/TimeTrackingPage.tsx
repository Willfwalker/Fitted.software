"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Clock, FileText, Search, Users, User } from "lucide-react"
import { TimeSummaryCard } from "./TimeSummaryCard"
import { TimeEntryList } from "./TimeEntryList"
import { TimeEntryForm } from "./TimeEntryForm"
import { TimerButton } from "./TimerButton"
import { GenerateInvoiceDialog } from "./GenerateInvoiceDialog"
import { TeamMemberSummary } from "./TeamMemberSummary"
import type { TimeEntry, TimeSummary } from "@/lib/types/time-tracking"
import type { OrgMember } from "@/lib/types/members"

interface TimeTrackingPageProps {
  entries: TimeEntry[]
  summary: TimeSummary
  runningTimer: TimeEntry | null
  searchQuery: string
  currentFilter: string
  currentView: "my" | "team"
  canViewTeam: boolean
  members: OrgMember[]
  selectedMemberId: string
  dateFrom: string
  dateTo: string
}

export function TimeTrackingPage({
  entries,
  summary,
  runningTimer,
  searchQuery,
  currentFilter,
  currentView,
  canViewTeam,
  members,
  selectedMemberId,
  dateFrom,
  dateTo,
}: TimeTrackingPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showForm, setShowForm] = useState(false)
  const [showInvoice, setShowInvoice] = useState(false)
  const [search, setSearch] = useState(searchQuery)

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    }
    router.push(`/time-tracking?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams({ q: search })
  }

  const switchView = (view: "my" | "team") => {
    // Clear member/date filters when switching views
    const params = new URLSearchParams()
    if (currentFilter) params.set("filter", currentFilter)
    if (search) params.set("q", search)
    params.set("view", view)
    router.push(`/time-tracking?${params.toString()}`)
  }

  const filters = [
    { label: "All", value: "" },
    { label: "Billable", value: "billable" },
    { label: "Non-billable", value: "non-billable" },
    { label: "Uninvoiced", value: "uninvoiced" },
    { label: "Invoiced", value: "invoiced" },
  ]

  const isTeamView = currentView === "team"
  const isViewingAllMembers = isTeamView && !selectedMemberId
  const billableEntries = entries.filter((e) => e.billable && !e.invoice_id)

  // Date preset helpers
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const lastOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)

  const fmt = (d: Date) => d.toISOString().split("T")[0]

  const datePresets = [
    { label: "This Week", from: fmt(monday), to: fmt(sunday) },
    { label: "This Month", from: fmt(firstOfMonth), to: fmt(lastOfMonth) },
    { label: "Last Month", from: fmt(firstOfLastMonth), to: fmt(lastOfLastMonth) },
  ]

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)] mb-1">
            Time Tracking
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-[1.6rem] text-[var(--text)] font-light tracking-tight">
            {isTeamView ? "Team Timesheets" : "Logged Hours"}
          </h1>
        </div>
        {!isTeamView && (
          <div className="flex items-center gap-2">
            <TimerButton runningEntry={runningTimer} />
            <Button
              onClick={() => setShowForm(true)}
              className="gap-1.5 bg-[var(--accent)] text-white hover:opacity-90"
              size="sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Log Time
            </Button>
          </div>
        )}
      </div>

      {/* View tabs */}
      {canViewTeam && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => switchView("my")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[0.8rem] font-medium transition-colors ${
              !isTeamView
                ? "bg-[rgba(212,115,78,0.1)] text-[var(--accent)]"
                : "text-[var(--text-muted)] hover:bg-[rgba(232,224,212,0.04)] hover:text-[var(--text)]"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            My Time
          </button>
          <button
            onClick={() => switchView("team")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[0.8rem] font-medium transition-colors ${
              isTeamView
                ? "bg-[rgba(212,115,78,0.1)] text-[var(--accent)]"
                : "text-[var(--text-muted)] hover:bg-[rgba(232,224,212,0.04)] hover:text-[var(--text)]"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Team
          </button>
        </div>
      )}

      {/* Team controls: member select + date range */}
      {isTeamView && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <select
            value={selectedMemberId}
            onChange={(e) => updateParams({ member: e.target.value })}
            className="h-9 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-[0.84rem] text-[var(--text)] outline-none focus:border-[var(--accent)]"
          >
            <option value="">All Members</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.full_name || m.email}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => updateParams({ from: e.target.value })}
              className="h-9 w-[140px] bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.8rem]"
            />
            <span className="text-[0.78rem] text-[var(--text-dim)]">to</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => updateParams({ to: e.target.value })}
              className="h-9 w-[140px] bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.8rem]"
            />
          </div>

          <div className="flex items-center gap-1">
            {datePresets.map((p) => (
              <button
                key={p.label}
                onClick={() => updateParams({ from: p.from, to: p.to })}
                className={`px-2.5 py-1 rounded-md text-[0.72rem] transition-colors ${
                  dateFrom === p.from && dateTo === p.to
                    ? "bg-[rgba(212,115,78,0.1)] text-[var(--accent)]"
                    : "text-[var(--text-dim)] hover:bg-[rgba(232,224,212,0.04)] hover:text-[var(--text)]"
                }`}
              >
                {p.label}
              </button>
            ))}
            {(dateFrom || dateTo) && (
              <button
                onClick={() => updateParams({ from: "", to: "" })}
                className="px-2.5 py-1 rounded-md text-[0.72rem] text-[var(--text-dim)] hover:text-[var(--text)]"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Summary cards */}
      <TimeSummaryCard summary={summary} />

      {/* Team member summary table (when viewing all members) */}
      {isViewingAllMembers && (
        <TeamMemberSummary entries={entries} members={members} />
      )}

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <form onSubmit={handleSearch} className="flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-dim)]" />
          <Input
            placeholder="Search entries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.84rem]"
          />
        </form>

        <div className="flex items-center gap-1.5">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => updateParams({ filter: f.value })}
              className={`px-3 py-1.5 rounded-lg text-[0.78rem] transition-colors ${
                currentFilter === f.value
                  ? "bg-[rgba(212,115,78,0.1)] text-[var(--accent)]"
                  : "text-[var(--text-muted)] hover:bg-[rgba(232,224,212,0.04)] hover:text-[var(--text)]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {billableEntries.length > 0 && !isTeamView && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInvoice(true)}
            className="gap-1.5 border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] ml-auto"
          >
            <FileText className="h-3.5 w-3.5" />
            Generate Invoice
          </Button>
        )}
      </div>

      {/* Entries list */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Clock className="h-10 w-10 text-[var(--text-dim)] mb-3" strokeWidth={1.2} />
          <p className="text-[0.9rem] text-[var(--text-muted)] mb-1">No time entries found</p>
          <p className="text-[0.78rem] text-[var(--text-dim)]">
            {isTeamView
              ? "No entries match the current filters."
              : "Start a timer or log time manually to get started."}
          </p>
        </div>
      ) : (
        <TimeEntryList
          entries={entries}
          showTask
          showUser={isTeamView}
          readOnly={isTeamView}
          members={members}
        />
      )}

      {/* Dialogs */}
      <TimeEntryForm
        open={showForm}
        onOpenChange={setShowForm}
      />

      {showInvoice && (
        <GenerateInvoiceDialog
          open={showInvoice}
          onOpenChange={setShowInvoice}
          entries={billableEntries}
        />
      )}
    </>
  )
}
