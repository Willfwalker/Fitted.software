import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient, TEST_ORG_ID, TEST_USER_ID } from '../mocks/supabase'

const mockClient = createMockSupabaseClient()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockClient),
}))

vi.mock('@/lib/actions/helpers', () => ({
  getOrgId: vi.fn().mockResolvedValue({ orgId: TEST_ORG_ID, userId: TEST_USER_ID, role: 'OWNER' }),
}))

const { updateMemberRole, removeMember } = await import('@/lib/actions/members')

describe('updateMemberRole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects promoting to OWNER', async () => {
    const result = await updateMemberRole('member-1', 'OWNER')
    expect(result.error).toBe('Cannot promote to OWNER')
  })

  it('rejects changing OWNER role', async () => {
    mockClient._chain.single.mockResolvedValueOnce({
      data: { user_id: 'other-user', role: 'OWNER' },
      error: null,
    })

    const result = await updateMemberRole('member-1', 'MEMBER')
    expect(result.error).toBe("Cannot change OWNER's role")
  })

  it('succeeds when changing MEMBER to ADMIN as OWNER', async () => {
    mockClient._chain.single.mockResolvedValueOnce({
      data: { user_id: 'other-user', role: 'MEMBER' },
      error: null,
    })

    const result = await updateMemberRole('member-1', 'ADMIN')
    expect(result.error).toBeUndefined()
  })

  it('rejects when not authenticated', async () => {
    const { getOrgId } = await import('@/lib/actions/helpers')
    vi.mocked(getOrgId).mockResolvedValueOnce(null as any)

    await expect(updateMemberRole('member-1', 'ADMIN')).rejects.toThrow('Not authenticated')
  })
})

describe('removeMember', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects removing OWNER', async () => {
    mockClient._chain.single.mockResolvedValueOnce({
      data: { user_id: 'owner-user', role: 'OWNER' },
      error: null,
    })

    const result = await removeMember('member-1')
    expect(result.error).toBe('Cannot remove the OWNER')
  })

  it('rejects removing self', async () => {
    mockClient._chain.single.mockResolvedValueOnce({
      data: { user_id: TEST_USER_ID, role: 'ADMIN' },
      error: null,
    })

    const result = await removeMember('member-1')
    expect(result.error).toBe('Cannot remove yourself')
  })

  it('succeeds when removing a MEMBER', async () => {
    mockClient._chain.single.mockResolvedValueOnce({
      data: { user_id: 'other-user', role: 'MEMBER' },
      error: null,
    })

    const result = await removeMember('member-1')
    expect(result.error).toBeUndefined()
  })
})
