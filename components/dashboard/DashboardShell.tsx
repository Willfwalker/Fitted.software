"use client"

import { useState } from "react"
import { DynamicNav } from "./DynamicNav"
import { MobileNav } from "./MobileNav"
import { DashboardHeader } from "./DashboardHeader"
import { AIChatSidebar } from "@/components/ai/AIChatSidebar"
import type { WorkspacePage } from "@/lib/blocks/types"

interface DashboardShellProps {
  orgName: string
  userName: string | null | undefined
  userEmail: string | null | undefined
  workspacePages: WorkspacePage[]
  children: React.ReactNode
}

export function DashboardShell({
  orgName,
  userName,
  userEmail,
  workspacePages,
  children,
}: DashboardShellProps) {
  const [aiOpen, setAiOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <DynamicNav
        orgName={orgName}
        userName={userName}
        userEmail={userEmail}
        workspacePages={workspacePages}
        onToggleAI={() => setAiOpen(!aiOpen)}
      />
      <MobileNav orgName={orgName} userName={userName} userEmail={userEmail} />
      <main className="lg:pl-[260px]">
        <DashboardHeader />
        {children}
      </main>
      <AIChatSidebar isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  )
}
