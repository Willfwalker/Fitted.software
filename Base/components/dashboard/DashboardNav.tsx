"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Settings } from "lucide-react"
import { ALL_MODULES, getEnabledModules, type ModuleKey } from "@/lib/config/modules"

interface DashboardNavProps {
  orgName: string
  userName: string | null | undefined
  userEmail: string | null | undefined
  enabledModules?: ModuleKey[]
}

export function DashboardNav({ orgName, userName, userEmail, enabledModules }: DashboardNavProps) {
  const pathname = usePathname()

  const modules = enabledModules
    ? getEnabledModules(enabledModules)
    : ALL_MODULES

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ...modules.map((m) => ({ href: m.href, label: m.label, icon: m.icon })),
  ]

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname === href || pathname.startsWith(href + "/")
  }

  const settingsActive = pathname.startsWith("/settings")

  const initials = (userName || userEmail || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-[260px] flex-col bg-[var(--bg-elevated)] border-r border-[var(--border)]">
      {/* Logo + org */}
      <div className="px-7 pt-7 pb-5">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-[1.5rem] text-[var(--text)] tracking-tight"
        >
          fitted.
        </Link>
        <p className="mt-1 text-[0.7rem] text-[var(--text-dim)] truncate font-light">{orgName}</p>
      </div>

      <div className="mx-6 h-px bg-[var(--border)]" />

      {/* Nav links */}
      <nav className="flex-1 px-4 py-5 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-4 py-2.5 text-[0.84rem] transition-all duration-200 ${active
                  ? "bg-[rgba(212,115,78,0.08)] text-[var(--text)]"
                  : "text-[var(--text-muted)] hover:bg-[rgba(232,224,212,0.03)] hover:text-[var(--text)]"
                }`}
            >
              <item.icon
                className={`h-[17px] w-[17px] shrink-0 ${active ? "text-[var(--accent)]" : ""
                  }`}
                strokeWidth={1.8}
              />
              <span className="font-light">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="mx-6 h-px bg-[var(--border)]" />
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 px-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-card)] border border-[var(--border)] text-[0.6rem] font-medium text-[var(--text-muted)]">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[0.82rem] text-[var(--text)] truncate font-light leading-tight">
              {userName || "User"}
            </p>
            <p className="text-[0.62rem] text-[var(--text-dim)] truncate mt-0.5">{userEmail}</p>
          </div>
          <Link
            href="/settings"
            className={`shrink-0 p-1.5 rounded-md transition-colors duration-200 ${settingsActive
                ? "text-[var(--accent)]"
                : "text-[var(--text-dim)] hover:text-[var(--text-muted)]"
              }`}
          >
            <Settings className="h-4 w-4" strokeWidth={1.8} />
          </Link>
        </div>
      </div>
    </aside>
  )
}
