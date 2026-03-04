"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const tabs = [
  { href: "/crm/contacts", label: "Contacts" },
  { href: "/crm/companies", label: "Companies" },
  { href: "/crm/deals", label: "Deals" },
]

export function CRMNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-1.5 rounded-full text-[0.82rem] font-light transition-all duration-200 ${
              active
                ? "bg-[rgba(212,115,78,0.1)] text-[var(--text)]"
                : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[rgba(232,224,212,0.03)]"
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
