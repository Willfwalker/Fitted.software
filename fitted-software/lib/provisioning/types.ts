export interface ProvisionConfig {
  slug: string
  businessName: string
  contactEmail: string
  accentColor: string
  customDomain?: string
  modules: string[]
}

export interface ProvisionContext extends ProvisionConfig {
  clientId: string
  githubRepo?: string
  supabaseRef?: string
  supabaseUrl?: string
  supabaseAnonKey?: string
  supabaseServiceKey?: string
  vercelProjectId?: string
  vercelUrl?: string
}

export interface LogEntry {
  step: string
  status: "pending" | "running" | "done" | "error"
  message?: string
  timestamp: string
}
