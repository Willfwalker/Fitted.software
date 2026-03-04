"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Plus, Mail, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ComposeMessage } from "./ComposeMessage"
import { deleteMessage } from "@/lib/actions/messages"
import type { Message, MessageStatus, MESSAGE_STATUSES } from "@/lib/types/messaging"
import type { Contact } from "@/lib/types/crm"
import type { MessageTemplate } from "@/lib/types/messaging"

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "FAILED", label: "Failed" },
]

const STATUS_COLORS: Record<MessageStatus, string> = {
  DRAFT: "#8A817A",
  SENT: "#5B8DEF",
  DELIVERED: "#5EC69A",
  FAILED: "#EF5B5B",
}

interface MessageListProps {
  messages: Message[]
  contacts: Pick<Contact, "id" | "first_name" | "last_name" | "email">[]
  templates: MessageTemplate[]
  searchQuery: string
  currentStatus?: string
}

export function MessageList({ messages, contacts, templates, searchQuery, currentStatus }: MessageListProps) {
  const router = useRouter()
  const [search, setSearch] = useState(searchQuery)
  const [composeOpen, setComposeOpen] = useState(false)

  const handleSearch = (value: string) => {
    setSearch(value)
    const params = new URLSearchParams()
    if (value) params.set("q", value)
    if (currentStatus && currentStatus !== "all") params.set("status", currentStatus)
    router.push(`/messages${params.toString() ? `?${params}` : ""}`)
  }

  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams()
    if (search) params.set("q", search)
    if (status !== "all") params.set("status", status)
    router.push(`/messages${params.toString() ? `?${params}` : ""}`)
  }

  const handleDelete = async (id: string) => {
    await deleteMessage(id)
    router.refresh()
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-dim)]" />
          <Input
            placeholder="Search messages..."
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
              className={`text-[0.78rem] px-3 py-1.5 rounded-md transition-colors font-light cursor-pointer ${
                (currentStatus || "all") === tab.value
                  ? "bg-[rgba(212,115,78,0.1)] text-[var(--accent)]"
                  : "text-[var(--text-dim)] hover:text-[var(--text-muted)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="ghost"
            onClick={() => router.push("/messages/templates")}
            className="text-[var(--text-muted)] text-[0.82rem] cursor-pointer"
          >
            Templates
          </Button>
          <Button
            onClick={() => setComposeOpen(true)}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-5 cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Compose
          </Button>
        </div>
      </div>

      {/* Table */}
      {messages.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-12 text-center">
          <Mail className="h-10 w-10 text-[var(--text-dim)] mx-auto mb-3" />
          <p className="text-[var(--text-muted)] text-[0.9rem] font-light mb-4">No messages found</p>
          <Button
            onClick={() => setComposeOpen(true)}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-5 cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Compose Message
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[var(--border)] hover:bg-transparent">
                <TableHead className="text-[var(--text-muted)] text-[0.75rem] font-medium uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-[var(--text-muted)] text-[0.75rem] font-medium uppercase tracking-wider">Recipient</TableHead>
                <TableHead className="text-[var(--text-muted)] text-[0.75rem] font-medium uppercase tracking-wider">Subject</TableHead>
                <TableHead className="text-[var(--text-muted)] text-[0.75rem] font-medium uppercase tracking-wider">Contact</TableHead>
                <TableHead className="text-[var(--text-muted)] text-[0.75rem] font-medium uppercase tracking-wider">Sent</TableHead>
                <TableHead className="text-[var(--text-muted)] text-[0.75rem] font-medium uppercase tracking-wider w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((msg) => (
                <TableRow
                  key={msg.id}
                  className="border-[var(--border)] cursor-pointer hover:bg-[rgba(232,224,212,0.02)] transition-colors"
                >
                  <TableCell>
                    <span
                      className="inline-flex items-center gap-1.5 text-[0.78rem] font-light"
                      style={{ color: STATUS_COLORS[msg.status] }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[msg.status] }}
                      />
                      {msg.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-[var(--text)] font-light text-[0.88rem]">
                    <div>{msg.recipient_name || msg.recipient_email || "—"}</div>
                    {msg.recipient_name && msg.recipient_email && (
                      <div className="text-[0.78rem] text-[var(--text-dim)]">{msg.recipient_email}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-[var(--text-muted)] font-light text-[0.85rem] max-w-[200px] truncate">
                    {msg.subject || "—"}
                  </TableCell>
                  <TableCell className="text-[var(--text-muted)] font-light text-[0.85rem]">
                    {msg.contact ? `${msg.contact.first_name} ${msg.contact.last_name}` : "—"}
                  </TableCell>
                  <TableCell className="text-[var(--text-dim)] font-light text-[0.82rem]">
                    {msg.sent_at
                      ? new Date(msg.sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="p-1.5 rounded-md text-[var(--text-dim)] hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ComposeMessage
        open={composeOpen}
        onOpenChange={setComposeOpen}
        contacts={contacts}
        templates={templates}
      />
    </>
  )
}
