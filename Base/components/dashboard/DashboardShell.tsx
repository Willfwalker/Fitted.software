"use client"

import { DashboardNav } from "./DashboardNav"
import { MobileNav } from "./MobileNav"
import { DashboardHeader } from "./DashboardHeader"
import type { ModuleKey } from "@/lib/config/modules"

interface DashboardShellProps {
  orgName: string
  userName: string | null | undefined
  userEmail: string | null | undefined
  enabledModules?: ModuleKey[]
  children: React.ReactNode
}

export function DashboardShell({
  orgName,
  userName,
  userEmail,
  enabledModules,
  children,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <DashboardNav
        orgName={orgName}
        userName={userName}
        userEmail={userEmail}
        enabledModules={enabledModules}
      />
      <MobileNav
        orgName={orgName}
        userName={userName}
        userEmail={userEmail}
        enabledModules={enabledModules}
      />
      <main className="lg:pl-[260px]">
        <DashboardHeader />
        {children}
      </main>
    </div>
  )
}
