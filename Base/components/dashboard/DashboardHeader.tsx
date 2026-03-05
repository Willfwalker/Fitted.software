"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Sparkles } from "lucide-react"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { ChatPanel } from "@/components/chat/ChatPanel"

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/crm/contacts": "Contacts",
  "/crm/companies": "Companies",
  "/crm/deals": "Deals",
  "/tasks": "Projects",
  "/invoicing": "Invoices",
  "/reports": "Reports",
  "/settings": "Settings",
  "/calendar": "Calendar",
  "/files": "Files",
  "/messages": "Messages",
  "/messages/templates": "Templates",
  "/forms": "Forms",
}

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  const sorted = Object.keys(PAGE_TITLES).sort((a, b) => b.length - a.length)
  for (const key of sorted) {
    if (pathname.startsWith(key)) return PAGE_TITLES[key]
  }
  return "Dashboard"
}

export function DashboardHeader() {
  const pathname = usePathname()
  const title = getPageTitle(pathname)
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <>
      <header className="hidden lg:flex items-center justify-between h-14 px-8 border-b border-[var(--border)] bg-[var(--bg)]">
        <h2 className="text-[0.92rem] text-[var(--text)] font-light tracking-tight">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent)] transition-colors"
          >
            <Sparkles className="size-3.5 text-[var(--accent)]" />
            Add a Feature
          </button>
          <NotificationBell />
        </div>
      </header>
      <ChatPanel open={chatOpen} onOpenChange={setChatOpen} />
    </>
  )
}
