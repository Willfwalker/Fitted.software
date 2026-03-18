"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Receipt, FolderKanban, FileText, ClipboardList, Home } from "lucide-react"
import type { PortalPermissions } from "@/lib/types/portal"

interface PortalLayoutProps {
  orgName: string
  clientName: string
  token: string
  permissions: PortalPermissions
  children: React.ReactNode
}

export function PortalLayout({
  orgName,
  clientName,
  token,
  permissions,
  children,
}: PortalLayoutProps) {
  const pathname = usePathname()
  const base = `/portal/${token}`

  const tabs = [
    { href: base, label: "Overview", icon: Home, show: true },
    { href: `${base}/invoices`, label: "Invoices", icon: Receipt, show: permissions.invoices },
    { href: `${base}/projects`, label: "Projects", icon: FolderKanban, show: permissions.projects },
    { href: `${base}/files`, label: "Files", icon: FileText, show: permissions.files },
    { href: `${base}/forms`, label: "Forms", icon: ClipboardList, show: permissions.forms },
  ].filter((t) => t.show)

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--bg-card)]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-[family-name:var(--font-display)] text-[1.1rem] text-[var(--text)] tracking-tight">
              {orgName}
            </p>
            <p className="text-[0.75rem] text-[var(--text-dim)]">Client Portal</p>
          </div>
          <p className="text-[0.8rem] text-[var(--text-muted)]">{clientName}</p>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="border-b border-[var(--border)] bg-[var(--bg-card)]">
        <div className="max-w-5xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || (tab.href !== base && pathname.startsWith(tab.href))
            const Icon = tab.icon
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-[0.8rem] font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-[var(--accent)] text-[var(--accent)]"
                    : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
