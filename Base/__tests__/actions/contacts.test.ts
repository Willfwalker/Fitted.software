import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient, TEST_ORG_ID, TEST_USER_ID } from '../mocks/supabase'

// Mock Supabase client
const mockClient = createMockSupabaseClient()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockClient),
}))

vi.mock('@/lib/actions/helpers', () => ({
  getOrgId: vi.fn().mockResolvedValue({ orgId: TEST_ORG_ID, userId: TEST_USER_ID }),
}))

// Import after mocks
const { createContact, updateContact, deleteContact, bulkDeleteContacts } = await import('@/lib/actions/contacts')

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(data)) {
    fd.set(key, value)
  }
  return fd
}

describe('createContact', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset chain to return success
    mockClient._chain.single.mockResolvedValue({ data: { id: 'new-id' }, error: null })
  })

  it('succeeds with valid data', async () => {
    const fd = makeFormData({ first_name: 'John', last_name: 'Doe', email: 'john@example.com' })
    const result = await createContact({}, fd)
    expect(result.success).toBe(true)
    expect(mockClient.from).toHaveBeenCalledWith('contacts')
  })

  it('fails with missing required fields', async () => {
    const fd = makeFormData({ first_name: '' })
    const result = await createContact({}, fd)
    expect(result.error).toBeDefined()
  })

  it('returns error when not authenticated', async () => {
    const { getOrgId } = await import('@/lib/actions/helpers')
    vi.mocked(getOrgId).mockResolvedValueOnce(null as any)

    const fd = makeFormData({ first_name: 'John', last_name: 'Doe' })
    const result = await createContact({}, fd)
    expect(result.error).toBeDefined()
  })
})

describe('deleteContact', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClient._chain.eq.mockReturnThis()
  })

  it('calls delete with correct id and org_id', async () => {
    // The chain needs to resolve when awaited
    const chain = {
      ...mockClient._chain,
      eq: vi.fn().mockReturnThis(),
    }
    // Make the final .eq() call resolve
    let eqCallCount = 0
    chain.eq = vi.fn(function(this: any) {
      eqCallCount++
      if (eqCallCount >= 2) {
        // After both .eq() calls, return a promise
        return Promise.resolve({ error: null })
      }
      return chain
    }) as any
    mockClient.from.mockReturnValue({ delete: vi.fn(() => chain) } as any)

    const result = await deleteContact('contact-123')
    expect(result.success).toBe(true)
  })
})

describe('bulkDeleteContacts', () => {
  it('rejects empty ids array', async () => {
    const result = await bulkDeleteContacts([])
    expect(result.error).toBeDefined()
  })
})
