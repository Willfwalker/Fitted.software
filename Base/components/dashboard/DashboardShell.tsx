"use client"

import { DashboardNav } from "./DashboardNav"
import { MobileNav } from "./MobileNav"
import { DashboardHeader } from "./DashboardHeader"

interface DashboardShellProps {
  orgName: string
  userName: string | null | undefined
  userEmail: string | null | undefined
  children: React.ReactNode
}

export function DashboardShell({
  orgName,
  userName,
  userEmail,
  children,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <DashboardNav
        orgName={orgName}
        userName={userName}
        userEmail={userEmail}
      />
      <MobileNav orgName={orgName} userName={userName} userEmail={userEmail} />
      <main className="lg:pl-[260px]">
        <DashboardHeader />
        {children}
      </main>
    </div>
  )
}
