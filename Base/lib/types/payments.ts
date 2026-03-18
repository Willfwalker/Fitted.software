// ============================================
// Payment & Stripe Type Definitions
// ============================================

export interface StripeCustomer {
  id: string
  org_id: string
  contact_id: string | null
  company_id: string | null
  stripe_customer_id: string
  email: string | null
  created_at: string
  updated_at: string
}
