// ============================================
// Integration Type Definitions
// ============================================

export type IntegrationProvider = "google_calendar" | "stripe"

export interface Integration {
  id: string
  org_id: string
  user_id: string
  provider: IntegrationProvider
  access_token: string | null
  refresh_token: string | null
  token_expiry: string | null
  config: Record<string, unknown>
  enabled: boolean
  created_at: string
  updated_at: string
}
