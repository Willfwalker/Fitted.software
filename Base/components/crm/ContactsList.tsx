"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Plus, MoreHorizontal, Pencil, Trash2, ArrowUpDown, Upload, Download } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ContactForm } from "./ContactForm"
import { DeleteConfirmDialog } from "./DeleteConfirmDialog"
import { EmptyState } from "./EmptyState"
import { CsvImportDialog } from "@/components/csv/CsvImportDialog"
import { CsvExportButton } from "@/components/csv/CsvExportButton"
import { deleteContact, bulkDeleteContacts } from "@/lib/actions/contacts"
import { exportContactsCsv } from "@/lib/actions/csv"
import type { Contact } from "@/lib/types/crm"

interface ContactsListProps {
  contacts: Contact[]
  companies: { id: string; name: string }[]
  searchQuery: string
  currentSort?: string
}

export function ContactsList({ contacts, companies, searchQuery, currentSort }: ContactsListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchQuery)
  const [showCreate, setShowCreate] = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkDelete, setShowBulkDelete] = useState(false)
  const [showImport, setShowImport] = useState(false)

  // Auto-open create dialog from ?create=true
  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setShowCreate(true)
      const params = new URLSearchParams(searchParams.toString())
      params.delete("create")
      router.replace(`/crm/contacts${params.toString() ? `?${params}` : ""}`)
    }
  }, [searchParams, router])

  const handleSearch = (value: string) => {
    setSearch(value)
    const params = new URLSearchParams()
    if (value) params.set("q", value)
    if (currentSort && currentSort !== "recent") params.set("sort", currentSort)
    router.push(`/crm/contacts${params.toString() ? `?${params}` : ""}`)
  }

  const handleSort = (value: string) => {
    const params = new URLSearchParams()
    if (search) params.set("q", search)
    if (value !== "recent") params.set("sort", value)
    router.push(`/crm/contacts${params.toString() ? `?${params}` : ""}`)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteContact(deleteTarget.id)
    setDeleteTarget(null)
    router.refresh()
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    await bulkDeleteContacts(Array.from(selectedIds))
    setSelectedIds(new Set())
    setShowBulkDelete(false)
    router.refresh()
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(contacts.map((c) => c.id)))
    }
  }

  const allSelected = contacts.length > 0 && selectedIds.size === contacts.length

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-dim)]" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-dim)]"
          />
        </div>
        <Select value={currentSort || "recent"} onValueChange={handleSort}>
          <SelectTrigger className="w-[150px] bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] text-[0.82rem]">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-[var(--text-dim)]" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
            <SelectItem value="recent" className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">Recent</SelectItem>
            <SelectItem value="name" className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">Name A-Z</SelectItem>
            <SelectItem value="company" className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">Company</SelectItem>
          </SelectContent>
        </Select>
        <CsvExportButton exportAction={exportContactsCsv} filename="contacts" />
        <Button
          variant="ghost"
          onClick={() => setShowImport(true)}
          className="text-[var(--text-muted)] hover:text-[var(--text)] text-[0.82rem]"
        >
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          Import
        </Button>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-5"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Contact
        </Button>
      </div>

      {/* Table */}
      {contacts.length === 0 ? (
        <EmptyState
          icon="Users"
          title="No contacts yet"
          description="Add your first contact to get started with your CRM."
          actionLabel="Add Contact"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[var(--border)] hover:bg-transparent">
                <TableHead className="w-[44px]">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent)] cursor-pointer"
                  />
                </TableHead>
                <TableHead className="text-[var(--text-muted)] text-[0.75rem] font-medium uppercase tracking-wider">Name</TableHead>
                <TableHead className="text-[var(--text-muted)] text-[0.75rem] font-medium uppercase tracking-wider">Email</TableHead>
                <TableHead className="text-[var(--text-muted)] text-[0.75rem] font-medium uppercase tracking-wider">Phone</TableHead>
                <TableHead className="text-[var(--text-muted)] text-[0.75rem] font-medium uppercase tracking-wider">Company</TableHead>
                <TableHead className="text-[var(--text-muted)] text-[0.75rem] font-medium uppercase tracking-wider">Title</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow
                  key={contact.id}
                  className={`border-[var(--border)] cursor-pointer hover:bg-[rgba(232,224,212,0.02)] transition-colors ${
                    selectedIds.has(contact.id) ? "bg-[rgba(212,115,78,0.04)]" : ""
                  }`}
                  onClick={() => router.push(`/crm/contacts/${contact.id}`)}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(contact.id)}
                      onChange={(e) => { e.stopPropagation(); toggleSelect(contact.id) }}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent)] cursor-pointer"
                    />
                  </TableCell>
                  <TableCell className="text-[var(--text)] font-light text-[0.88rem]">
                    {contact.first_name} {contact.last_name}
                  </TableCell>
                  <TableCell className="text-[var(--text-muted)] font-light text-[0.85rem]">
                    {contact.email || "—"}
                  </TableCell>
                  <TableCell className="text-[var(--text-muted)] font-light text-[0.85rem]">
                    {contact.phone || "—"}
                  </TableCell>
                  <TableCell className="text-[var(--text-muted)] font-light text-[0.85rem]">
                    {contact.company?.name || "—"}
                  </TableCell>
                  <TableCell className="text-[var(--text-muted)] font-light text-[0.85rem]">
                    {contact.title || "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--text-dim)] hover:text-[var(--text)]">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[var(--bg-card)] border-[var(--border)]">
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); setEditContact(contact) }}
                          className="text-[var(--text-muted)] focus:text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]"
                        >
                          <Pencil className="h-3.5 w-3.5 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(contact) }}
                          className="text-red-400 focus:text-red-300 focus:bg-[rgba(232,224,212,0.05)]"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 rounded-full bg-[var(--bg-card)] border border-[var(--border)] shadow-lg">
          <span className="text-[0.85rem] text-[var(--text)] font-light">
            {selectedIds.size} selected
          </span>
          <Button
            onClick={() => setShowBulkDelete(true)}
            className="bg-red-500/90 hover:bg-red-500 text-white rounded-full px-5 text-[0.82rem]"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      )}

      {/* Create Dialog */}
      <ContactForm
        open={showCreate}
        onOpenChange={setShowCreate}
        companies={companies}
      />

      {/* Edit Dialog */}
      {editContact && (
        <ContactForm
          open={!!editContact}
          onOpenChange={(open) => { if (!open) setEditContact(null) }}
          companies={companies}
          contact={editContact}
        />
      )}

      {/* Delete Confirm (single) */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        onConfirm={handleDelete}
        title="Delete Contact"
        description={`Are you sure you want to delete ${deleteTarget?.first_name} ${deleteTarget?.last_name}? This action cannot be undone.`}
      />

      {/* Delete Confirm (bulk) */}
      <DeleteConfirmDialog
        open={showBulkDelete}
        onOpenChange={setShowBulkDelete}
        onConfirm={handleBulkDelete}
        title="Delete Contacts"
        description={`Are you sure you want to delete ${selectedIds.size} contact${selectedIds.size !== 1 ? "s" : ""}? This action cannot be undone.`}
      />

      {/* CSV Import */}
      <CsvImportDialog
        open={showImport}
        onOpenChange={setShowImport}
        type="contacts"
      />
    </>
  )
}
