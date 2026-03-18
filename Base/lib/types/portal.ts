// ============================================
// Client Portal Type Definitions
// ============================================

export interface PortalPermissions {
  invoices: boolean
  projects: boolean
  files: boolean
  forms: boolean
}

export interface ClientPortal {
  id: string
  org_id: string
  contact_id: string | null
  company_id: string | null
  token: string
  enabled: boolean
  permissions: PortalPermissions
  created_by: string
  created_at: string
  updated_at: string
  // Joined
  contact?: { id: string; first_name: string; last_name: string; email: string | null } | null
  company?: { id: string; name: string } | null
}
