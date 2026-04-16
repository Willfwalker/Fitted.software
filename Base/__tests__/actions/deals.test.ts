import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient, TEST_ORG_ID, TEST_USER_ID } from '../mocks/supabase'

const mockClient = createMockSupabaseClient()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockClient),
}))

vi.mock('@/lib/actions/helpers', () => ({
  getOrgId: vi.fn().mockResolvedValue({ orgId: TEST_ORG_ID, userId: TEST_USER_ID, role: 'OWNER' }),
}))

vi.mock('@/lib/actions/notifications', () => ({
  notifyOrgMembers: vi.fn().mockResolvedValue(undefined),
  createNotification: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/automations/engine', () => ({
  runAutomations: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/rbac/require', () => ({
  requirePermission: vi.fn().mockResolvedValue({ supabase: mockClient, ctx: { orgId: TEST_ORG_ID, userId: TEST_USER_ID, role: 'OWNER' } }),
}))

const { createDeal, updateDeal, moveDealStage, deleteDeal } = await import('@/lib/actions/deals')

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(data)) {
    fd.set(key, value)
  }
  return fd
}

describe('createDeal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClient._chain.single.mockResolvedValue({ data: { id: 'deal-123' }, error: null })
  })

  it('succeeds with valid data', async () => {
    const fd = makeFormData({ title: 'Big Contract', stage: 'LEAD', priority: 'MEDIUM', value: '50000' })
    const result = await createDeal({}, fd)
    expect(result.success).toBe(true)
    expect(mockClient.from).toHaveBeenCalledWith('deals')
  })

  it('fails with empty title', async () => {
    const fd = makeFormData({ title: '', stage: 'LEAD', priority: 'MEDIUM' })
    const result = await createDeal({}, fd)
    expect(result.error).toBeDefined()
  })

  it('fails with invalid stage', async () => {
    const fd = makeFormData({ title: 'X', stage: 'BOGUS', priority: 'MEDIUM' })
    const result = await createDeal({}, fd)
    expect(result.error).toBeDefined()
  })

  it('returns error when not authenticated', async () => {
    const { getOrgId } = await import('@/lib/actions/helpers')
    vi.mocked(getOrgId).mockResolvedValueOnce(null as any)

    const fd = makeFormData({ title: 'X', stage: 'LEAD', priority: 'MEDIUM' })
    const result = await createDeal({}, fd)
    expect(result.error).toBeDefined()
  })

  it('extracts metadata.* keys from FormData', async () => {
    const fd = makeFormData({
      title: 'With Meta',
      stage: 'QUALIFIED',
      priority: 'HIGH',
      'metadata.source': 'referral',
      'metadata.campaign': 'q1',
    })
    const result = await createDeal({}, fd)
    expect(result.success).toBe(true)
  })
})

describe('updateDeal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when not authenticated', async () => {
    const { getOrgId } = await import('@/lib/actions/helpers')
    vi.mocked(getOrgId).mockResolvedValueOnce(null as any)

    const fd = makeFormData({ title: 'X', stage: 'LEAD', priority: 'MEDIUM' })
    const result = await updateDeal('deal-123', {}, fd)
    expect(result.error).toBeDefined()
  })

  it('fails validation with negative value', async () => {
    const fd = makeFormData({ title: 'X', stage: 'LEAD', priority: 'MEDIUM', value: '-100' })
    const result = await updateDeal('deal-123', {}, fd)
    expect(result.error).toBeDefined()
  })
})

describe('moveDealStage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when not authenticated', async () => {
    const { getOrgId } = await import('@/lib/actions/helpers')
    vi.mocked(getOrgId).mockResolvedValueOnce(null as any)

    const result = await moveDealStage('deal-123', 'WON', 0)
    expect(result.error).toBeDefined()
  })

  it('returns error when deal not found', async () => {
    mockClient._chain.single.mockResolvedValueOnce({ data: null, error: null })
    const result = await moveDealStage('missing-deal', 'WON', 0)
    expect(result.error).toBe('Deal not found')
  })
})

describe('deleteDeal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns permission error when requirePermission throws', async () => {
    const { requirePermission } = await import('@/lib/rbac/require')
    vi.mocked(requirePermission).mockRejectedValueOnce(new Error('forbidden'))

    const result = await deleteDeal('deal-123')
    expect(result.error).toBe('Insufficient permissions')
  })
})
