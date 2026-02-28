"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Plus, AlertTriangle, ArrowUpDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DynamicFilters } from "@/components/crm/DynamicFilters"
import { StatusBadge } from "./StatusBadge"
import type { Invoice, InvoiceStatus } from "@/lib/types/crm"
import type { UiConfig } from "@/lib/types/ui-config"

interface InvoiceListProps {
  invoices: Invoice[]
  searchQuery: string
  currentStatus?: string
  uiConfig?: UiConfig
}

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "CANCELLED", label: "Cancelled" },
]

export function InvoiceList({ invoices, searchQuery, currentStatus, uiConfig }: InvoiceListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchQuery)

  const currentSort = searchParams.get("sort") || ""

  const handleSearch = (value: string) => {
    setSearch(value)
    const params = new URLSearchParams()
    if (value) params.set("q", value)
    if (currentStatus && currentStatus !== "all") params.set("status", currentStatus)
    if (currentSort) params.set("sort", currentSort)
    router.push(`/dashboard/invoicing${params.toString() ? `?${params}` : ""}`)
  }

  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams()
    if (search) params.set("q", search)
    if (status !== "all") params.set("status", status)
    if (currentSort) params.set("sort", currentSort)
    router.push(`/dashboard/invoicing${params.toString() ? `?${params}` : ""}`)
  }

  const handleSort = (value: string) => {
    const params = new URLSearchParams()
    if (search) params.set("q", search)
    if (currentStatus && currentStatus !== "all") params.set("status", currentStatus)
    if (value !== "recent") params.set("sort", value)
    router.push(`/dashboard/invoicing${params.toString() ? `?${params}` : ""}`)
  }

  const hasSorts = uiConfig?.sorts && uiConfig.sorts.length > 0

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-dim)]" />
          <Input
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-dim)]"
          />
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleStatusFilter(tab.value)}
              className={`text-[0.78rem] px-3 py-1.5 rounded-md transition-colors font-light ${
                (currentStatus || "all") === tab.value
                  ? "bg-[rgba(212,115,78,0.1)] text-[var(--accent)]"
                  : "text-[var(--text-dim)] hover:text-[var(--text-muted)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort dropdown (shown when custom sorts are configured) */}
        {hasSorts && (
          <Select value={currentSort || "recent"} onValueChange={handleSort}>
            <SelectTrigger className="w-[150px] bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] text-[0.82rem]">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-[var(--text-dim)]" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
              <SelectItem value="recent" className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">Recent</SelectItem>
              {uiConfig?.sorts?.map((s) => (
                <SelectItem key={s.key} value={s.key} className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {uiConfig?.filters && uiConfig.filters.length > 0 && (
          <DynamicFilters filters={uiConfig.filters} basePath="/dashboard/invoicing" />
        )}

        <Button
          onClick={() => router.push("/dashboard/invoicing/new")}
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-5"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New Invoice
        </Button>
      </div>

      {/* Table */}
      {invoices.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-12 text-center">
          <p className="text-[var(--text-muted)] text-[0.9rem] font-light mb-4">No invoices found</p>
          <Button
            onClick={() => router.push("/dashboard/invoicing/new")}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-5"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create Invoice
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[var(--border)] hover:bg-transparent">
                <TableHead className="text-[var(--text-muted)] text-[0.75rem] font-medium uppercase tracking-wider">Invoice</TableHead>
                <TableHead className="text-[var(--text-muted)] text-[0.75rem] font-medium uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-[var(--text-muted)] text-[0.75rem] font-medium uppercase tracking-wider">Client</TableHead>
                <TableHead className="text-[var(--text-muted)] text-[0.75rem] font-medium uppercase tracking-wider">Amount</TableHead>
                <TableHead className="text-[var(--text-muted)] text-[0.75rem] font-medium uppercase tracking-wider">Due Date</TableHead>
                <TableHead className="text-[var(--text-muted)] text-[0.75rem] font-medium uppercase tracking-wider">Created</TableHead>
                {uiConfig?.columns?.filter(c => c.visible).map((col) => (
                  <TableHead key={col.key} className="text-[var(--text-muted)] text-[0.75rem] font-medium uppercase tracking-wider">{col.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  className="border-[var(--border)] cursor-pointer hover:bg-[rgba(232,224,212,0.02)] transition-colors"
                  onClick={() => router.push(`/dashboard/invoicing/${invoice.id}`)}
                >
                  <TableCell className="text-[var(--text)] font-light text-[0.88rem]">
                    {invoice.invoice_number}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={invoice.status as InvoiceStatus} />
                  </TableCell>
                  <TableCell className="text-[var(--text-muted)] font-light text-[0.85rem]">
                    {invoice.company?.name || (invoice.contact ? `${invoice.contact.first_name} ${invoice.contact.last_name}` : "—")}
                  </TableCell>
                  <TableCell className="text-[var(--text)] font-light text-[0.88rem]">
                    ${Number(invoice.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-[var(--text-muted)] font-light text-[0.85rem]">
                    {invoice.due_date ? (
                      <span className={`inline-flex items-center gap-1 ${
                        invoice.status === "SENT" && new Date(invoice.due_date) < new Date(new Date().toDateString())
                          ? "text-[#EF5B5B]"
                          : ""
                      }`}>
                        {invoice.status === "SENT" && new Date(invoice.due_date) < new Date(new Date().toDateString()) && (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {new Date(invoice.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-[var(--text-dim)] font-light text-[0.82rem]">
                    {new Date(invoice.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </TableCell>
                  {uiConfig?.columns?.filter(c => c.visible).map((col) => (
                    <TableCell key={col.key} className="text-[var(--text-muted)] font-light text-[0.85rem]">
                      {col.source === "metadata"
                        ? (invoice as unknown as Record<string, unknown>).metadata
                          ? String(((invoice as unknown as Record<string, unknown>).metadata as unknown as Record<string, unknown>)?.[col.column] ?? "—")
                          : "—"
                        : String((invoice as unknown as Record<string, unknown>)[col.column] ?? "—")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
