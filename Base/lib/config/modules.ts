import {
  Users,
  FolderKanban,
  CalendarDays,
  Receipt,
  BarChart3,
  Paperclip,
  MessageSquare,
  ClipboardList,
  Zap,
  Timer,
} from "lucide-react"

export type ModuleKey =
  | "crm"
  | "tasks"
  | "calendar"
  | "invoicing"
  | "messaging"
  | "files"
  | "forms"
  | "reports"
  | "automations"
  | "time-tracking"

export interface ModuleDef {
  key: ModuleKey
  label: string
  href: string
  icon: React.ElementType
  description: string
}

/** All available modules. Dashboard is always shown — not toggleable. */
export const ALL_MODULES: ModuleDef[] = [
  { key: "crm", label: "CRM", href: "/crm/contacts", icon: Users, description: "Manage contacts, companies, and deals" },
  { key: "tasks", label: "Projects", href: "/tasks", icon: FolderKanban, description: "Track tasks and projects" },
  { key: "calendar", label: "Calendar", href: "/calendar", icon: CalendarDays, description: "Scheduling and calendar events" },
  { key: "invoicing", label: "Invoices", href: "/invoicing", icon: Receipt, description: "Create and send invoices" },
  { key: "messaging", label: "Messages", href: "/messages", icon: MessageSquare, description: "Email and messaging" },
  { key: "files", label: "Files", href: "/files", icon: Paperclip, description: "File storage and sharing" },
  { key: "forms", label: "Forms", href: "/forms", icon: ClipboardList, description: "Build and manage forms" },
  { key: "reports", label: "Reports", href: "/reports", icon: BarChart3, description: "Analytics and reporting" },
  { key: "automations", label: "Automations", href: "/automations", icon: Zap, description: "Workflow automation rules" },
  { key: "time-tracking", label: "Time Tracking", href: "/time-tracking", icon: Timer, description: "Track hours and generate invoices" },
]

export const ALL_MODULE_KEYS: ModuleKey[] = ALL_MODULES.map((m) => m.key)

/** Default: all modules enabled */
export const DEFAULT_ENABLED_MODULES: ModuleKey[] = [...ALL_MODULE_KEYS]

/** Filter modules by enabled keys */
export function getEnabledModules(enabledKeys: ModuleKey[]): ModuleDef[] {
  return ALL_MODULES.filter((m) => enabledKeys.includes(m.key))
}
