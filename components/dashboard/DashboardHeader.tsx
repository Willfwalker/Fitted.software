"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Sparkles, Send, Loader2, Users, Building2, Briefcase, FileText, BarChart3, LayoutDashboard, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { EntityType } from "@/lib/types/ui-config"

const SECTIONS: { value: EntityType; label: string; icon: typeof Users; description: string; comingSoon?: boolean }[] = [
  { value: "contacts", label: "Contacts", icon: Users, description: "Fields, filters, columns, sorts" },
  { value: "companies", label: "Companies", icon: Building2, description: "Fields, filters, columns, sorts" },
  { value: "deals", label: "Deals", icon: Briefcase, description: "Fields, filters" },
  { value: "invoices", label: "Invoices", icon: FileText, description: "Filters, columns, sorts" },
  { value: "reports", label: "Reports", icon: BarChart3, description: "Coming soon", comingSoon: true },
  { value: "dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Coming soon", comingSoon: true },
]

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/crm/contacts": "Contacts",
  "/dashboard/crm/companies": "Companies",
  "/dashboard/crm/deals": "Deals",
  "/dashboard/invoicing": "Invoices",
  "/dashboard/reports": "Reports",
  "/dashboard/settings": "Settings",
  "/dashboard/settings/custom-fields": "Custom Fields",
}

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  const sorted = Object.keys(PAGE_TITLES).sort((a, b) => b.length - a.length)
  for (const key of sorted) {
    if (pathname.startsWith(key)) return PAGE_TITLES[key]
  }
  return "Dashboard"
}

interface Message {
  role: "system" | "user" | "assistant"
  content: string
}

export function DashboardHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [activeEntity, setActiveEntity] = useState<EntityType | null>(null)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const title = getPageTitle(pathname)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input when entity is picked
  useEffect(() => {
    if (activeEntity) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [activeEntity])

  function handleOpen() {
    setOpen(true)
    setActiveEntity(null)
    setMessages([])
    setInput("")
  }

  function handleClose() {
    setOpen(false)
    setActiveEntity(null)
    setMessages([])
    setInput("")
  }

  function handlePickSection(entity: EntityType) {
    setActiveEntity(entity)
    const section = SECTIONS.find((s) => s.value === entity)
    const label = section?.label ?? entity
    const comingSoon = section?.comingSoon
    const desc = section?.description ?? ""

    const intro = comingSoon
      ? `${label} customization is coming soon! I'll note your request for when it's available.`
      : `You can add ${desc.toLowerCase()} to ${label}. What would you like?`

    setMessages([{ role: "assistant", content: intro }])
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !activeEntity || loading) return

    const userMessage = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setLoading(true)

    try {
      // Fetch current config
      const configRes = await fetch(`/api/ui-config/get?entityType=${activeEntity}`)
      const currentConfig = configRes.ok
        ? (await configRes.json()).config ?? { fields: [] }
        : { fields: [] }

      const res = await fetch("/api/ui-config/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: activeEntity,
          userRequest: userMessage,
          currentConfig,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.error || "Something went wrong. Try again." },
        ])
        return
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message || "Done." },
      ])
      router.refresh()
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Try again." },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <header className="hidden lg:flex items-center justify-between h-14 px-8 border-b border-[var(--border)] bg-[var(--bg)]">
        <h2 className="text-[0.92rem] text-[var(--text)] font-light tracking-tight">
          {title}
        </h2>

        <Button
          onClick={handleOpen}
          variant="ghost"
          className="text-[0.82rem] text-[var(--text-muted)] hover:text-[var(--text)] gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Add a Feature
        </Button>
      </header>

      <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
        <SheetContent
          side="right"
          className="w-[400px] bg-[var(--bg-elevated)] border-[var(--border)] p-0 flex flex-col [&>button]:hidden"
        >
          {/* Panel header */}
          <SheetHeader className="px-6 pt-5 pb-4 border-b border-[var(--border)] shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="font-[family-name:var(--font-display)] text-[1.1rem] text-[var(--text)] tracking-tight flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                Add a Feature
              </SheetTitle>
              <button
                onClick={handleClose}
                className="text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </SheetHeader>

          {/* Section picker */}
          {!activeEntity && (
            <div className="flex-1 px-6 py-6 space-y-3">
              <p className="text-[0.85rem] text-[var(--text-muted)] font-light">
                Where do you want to add it?
              </p>
              <div className="space-y-2">
                {SECTIONS.map((s) => {
                  const Icon = s.icon
                  return (
                    <button
                      key={s.value}
                      onClick={() => handlePickSection(s.value)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[rgba(212,115,78,0.04)] transition-all text-left cursor-pointer"
                    >
                      <Icon className="h-4 w-4 text-[var(--text-muted)] shrink-0" strokeWidth={1.5} />
                      <div className="flex flex-col">
                        <span className="text-[0.88rem] text-[var(--text)] font-light">{s.label}</span>
                        <span className={`text-[0.73rem] font-light ${s.comingSoon ? "text-[var(--accent)]" : "text-[var(--text-dim)]"}`}>
                          {s.description}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Chat area */}
          {activeEntity && (
            <>
              {/* Section badge */}
              <div className="px-6 pt-4 pb-2 shrink-0">
                <button
                  onClick={() => {
                    setActiveEntity(null)
                    setMessages([])
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(212,115,78,0.08)] text-[0.75rem] text-[var(--accent)] hover:bg-[rgba(212,115,78,0.14)] transition-colors"
                >
                  {(() => {
                    const Icon = SECTIONS.find((s) => s.value === activeEntity)?.icon ?? Users
                    return <Icon className="h-3 w-3" />
                  })()}
                  <span className="capitalize">{activeEntity}</span>
                  <X className="h-3 w-3 ml-0.5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-3 space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[0.85rem] font-light ${
                        msg.role === "user"
                          ? "bg-[var(--accent)] text-[var(--bg)] rounded-br-md"
                          : "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text)] rounded-bl-md"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl rounded-bl-md px-4 py-2.5">
                      <Loader2 className="h-4 w-4 animate-spin text-[var(--text-dim)]" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-6 py-4 border-t border-[var(--border)] shrink-0">
                <form onSubmit={handleSend} className="flex gap-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe what you want..."
                    disabled={loading}
                    className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[0.85rem] text-[var(--text)] placeholder:text-[var(--text-dim)] font-light outline-none focus:border-[var(--accent)] transition-colors"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={loading || !input.trim()}
                    className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-xl h-[42px] w-[42px] shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
