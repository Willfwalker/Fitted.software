import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient, TEST_ORG_ID, TEST_USER_ID } from '../mocks/supabase'

const mockClient = createMockSupabaseClient()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockClient),
}))

vi.mock('@/lib/actions/helpers', () => ({
  getOrgId: vi.fn().mockResolvedValue({ orgId: TEST_ORG_ID, userId: TEST_USER_ID, role: 'OWNER' }),
}))

const { createCompany, deleteCompany, bulkDeleteCompanies } = await import('@/lib/actions/companies')

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(data)) {
    fd.set(key, value)
  }
  return fd
}

describe('createCompany', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClient._chain.single.mockResolvedValue({ data: { id: 'comp-123' }, error: null })
  })

  it('succeeds with valid data', async () => {
    const fd = makeFormData({ name: 'Acme Inc', domain: 'acme.com' })
    const result = await createCompany({}, fd)
    expect(result.success).toBe(true)
    expect(mockClient.from).toHaveBeenCalledWith('companies')
  })

  it('fails with empty name', async () => {
    const fd = makeFormData({ name: '' })
    const result = await createCompany({}, fd)
    expect(result.error).toBeDefined()
  })

  it('returns error when not authenticated', async () => {
    const { getOrgId } = await import('@/lib/actions/helpers')
    vi.mocked(getOrgId).mockResolvedValueOnce(null as any)

    const fd = makeFormData({ name: 'Acme' })
    const result = await createCompany({}, fd)
    expect(result.error).toBeDefined()
  })
})

describe('bulkDeleteCompanies', () => {
  it('rejects empty ids array', async () => {
    const result = await bulkDeleteCompanies([])
    expect(result.error).toBeDefined()
  })
})
