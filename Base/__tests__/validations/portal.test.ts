import { describe, it, expect } from 'vitest'
import { clientPortalSchema } from '@/lib/validations/portal'

describe('clientPortalSchema', () => {
  it('accepts valid portal with contact', () => {
    const result = clientPortalSchema.safeParse({
      contact_id: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.permissions.invoices).toBe(true)
      expect(result.data.permissions.projects).toBe(true)
      expect(result.data.permissions.files).toBe(true)
      expect(result.data.permissions.forms).toBe(true)
    }
  })

  it('accepts valid portal with company', () => {
    const result = clientPortalSchema.safeParse({
      company_id: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
  })

  it('accepts custom permissions', () => {
    const result = clientPortalSchema.safeParse({
      contact_id: '550e8400-e29b-41d4-a716-446655440000',
      permissions: {
        invoices: true,
        projects: false,
        files: true,
        forms: false,
      },
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.permissions.projects).toBe(false)
      expect(result.data.permissions.forms).toBe(false)
    }
  })

  it('defaults permissions when not provided', () => {
    const result = clientPortalSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.permissions).toEqual({
        invoices: true,
        projects: true,
        files: true,
        forms: true,
      })
    }
  })

  it('rejects invalid UUID for contact_id', () => {
    const result = clientPortalSchema.safeParse({
      contact_id: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('accepts empty string for optional IDs', () => {
    const result = clientPortalSchema.safeParse({
      contact_id: '',
      company_id: '',
    })
    expect(result.success).toBe(true)
  })
})
