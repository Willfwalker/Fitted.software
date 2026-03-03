"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, LayoutDashboard, Users, FolderKanban, Clock, Receipt, BarChart3, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { SignOutButton } from "./SignOutButton"

interface MobileNavProps {
  orgName: string
  userName: string | null | undefined
  userEmail: string | null | undefined
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/ai-command", label: "AI Command Center", icon: LayoutDashboard },
  { href: "/dashboard/crm/contacts", label: "CRM", icon: Users },
  { href: "#", label: "Projects", icon: FolderKanban, disabled: true },
  { href: "#", label: "Time", icon: Clock, disabled: true },
  { href: "/dashboard/invoicing", label: "Invoices", icon: Receipt },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
]

export function MobileNav({ orgName, userName, userEmail }: MobileNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname === href || pathname.startsWith(href + "/")
  }

  const initials = (userName || userEmail || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-5 py-3 bg-[var(--bg-elevated)] border-b border-[var(--border)]">
      <Link
        href="/"
        className="font-[family-name:var(--font-display)] text-[1.3rem] text-[var(--text)] tracking-tight"
      >
        fitted.
      </Link>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-[var(--text-muted)] hover:text-[var(--text)]">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] bg-[var(--bg-elevated)] border-[var(--border)] p-0">
          <SheetHeader className="px-7 pt-7 pb-5">
            <SheetTitle className="font-[family-name:var(--font-display)] text-[1.5rem] text-[var(--text)] tracking-tight text-left">
              fitted.
            </SheetTitle>
            <p className="text-[0.7rem] text-[var(--text-dim)] truncate font-light text-left">{orgName}</p>
          </SheetHeader>

          <div className="mx-6 h-px bg-[var(--border)]" />

          <nav className="flex-1 px-4 py-5 space-y-0.5">
            {navItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.label}
                  href={item.disabled ? "#" : item.href}
                  onClick={() => !item.disabled && setOpen(false)}
                  className={`group flex items-center gap-3 rounded-lg px-4 py-2.5 text-[0.84rem] transition-all duration-200 ${active
                      ? "bg-[rgba(212,115,78,0.08)] text-[var(--text)]"
                      : item.disabled
                        ? "text-[var(--text-dim)] opacity-40 pointer-events-none"
                        : "text-[var(--text-muted)] hover:bg-[rgba(232,224,212,0.03)] hover:text-[var(--text)]"
                    }`}
                  aria-disabled={item.disabled}
                  tabIndex={item.disabled ? -1 : undefined}
                >
                  <item.icon
                    className={`h-[17px] w-[17px] shrink-0 ${active ? "text-[var(--accent)]" : ""}`}
                    strokeWidth={1.8}
                  />
                  <span className="font-light">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="mx-6 h-px bg-[var(--border)]" />

          <div className="px-4 py-4">
            <div className="flex items-center gap-3 px-3 mb-3">
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
                href="/dashboard/settings"
                onClick={() => setOpen(false)}
                className="shrink-0 p-1.5 rounded-md text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors"
              >
                <Settings className="h-4 w-4" strokeWidth={1.8} />
              </Link>
            </div>
            <div className="px-3">
              <SignOutButton />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
