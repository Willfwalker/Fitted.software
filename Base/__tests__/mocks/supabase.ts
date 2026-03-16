import { vi } from 'vitest'

/**
 * Creates a mock Supabase client with chainable query builder.
 * Pass overrides to customize return values for specific methods.
 */
export function createMockSupabaseClient(overrides: Record<string, any> = {}) {
  const mockChain: Record<string, any> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: undefined, // prevent auto-resolve as thenable
    ...overrides,
  }

  // Make sure `.then` is not set so the chain isn't treated as a promise
  // until explicitly awaited via `.single()`, etc.
  // If no terminal method override, default the chain itself to resolve:
  if (!overrides.select && !overrides.insert && !overrides.update && !overrides.delete) {
    // When the chain is awaited directly (no .single()), resolve with empty data
    const originalSelect = mockChain.select
    mockChain.select = vi.fn((...args: any[]) => {
      originalSelect(...args)
      return { ...mockChain, then: (resolve: any) => resolve({ data: [], error: null }) }
    })
  }

  const client = {
    from: vi.fn(() => ({ ...mockChain })),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
    },
    rpc: vi.fn().mockResolvedValue({ data: 'INV-001', error: null }),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test/file.pdf' }, error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://test.url' }, error: null }),
      })),
    },
    _chain: mockChain, // exposed for test assertions
  }

  return client
}

/**
 * Mock getOrgId() to return authenticated context.
 * Use mockReturnValue(null) to simulate unauthenticated.
 */
export const TEST_ORG_ID = 'test-org-id'
export const TEST_USER_ID = 'test-user-id'

export function mockGetOrgId() {
  return vi.fn().mockResolvedValue({ orgId: TEST_ORG_ID, userId: TEST_USER_ID, role: 'OWNER' })
}

export function mockGetOrgIdNull() {
  return vi.fn().mockResolvedValue(null)
}
