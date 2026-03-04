"use client"

import { usePathname } from "next/navigation"
import { NotificationBell } from "@/components/notifications/NotificationBell"

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

  return (
    <header className="hidden lg:flex items-center justify-between h-14 px-8 border-b border-[var(--border)] bg-[var(--bg)]">
      <h2 className="text-[0.92rem] text-[var(--text)] font-light tracking-tight">
        {title}
      </h2>
      <NotificationBell />
    </header>
  )
}
