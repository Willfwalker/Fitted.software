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

vi.mock('@/lib/actions/google-calendar', () => ({
  pushEventToGoogle: vi.fn().mockResolvedValue(undefined),
  deleteEventFromGoogle: vi.fn().mockResolvedValue(undefined),
}))

const { createEvent, updateEvent, updateEventStatus, updateEventTime, deleteEvent } = await import('@/lib/actions/events')

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(data)) {
    fd.set(key, value)
  }
  return fd
}

describe('createEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClient._chain.single.mockResolvedValue({ data: { id: 'event-123' }, error: null })
  })

  it('succeeds with valid data', async () => {
    const fd = makeFormData({
      title: 'Team standup',
      start_at: '2026-05-01T10:00:00Z',
      end_at: '2026-05-01T10:30:00Z',
    })
    const result = await createEvent({}, fd)
    expect(result.success).toBe(true)
    expect(mockClient.from).toHaveBeenCalledWith('calendar_events')
  })

  it('fails with empty title', async () => {
    const fd = makeFormData({ title: '', start_at: '2026-05-01T10:00:00Z' })
    const result = await createEvent({}, fd)
    expect(result.error).toBeDefined()
  })

  it('fails with missing start_at', async () => {
    const fd = makeFormData({ title: 'X' })
    const result = await createEvent({}, fd)
    expect(result.error).toBeDefined()
  })

  it('returns error when not authenticated', async () => {
    const { getOrgId } = await import('@/lib/actions/helpers')
    vi.mocked(getOrgId).mockResolvedValueOnce(null as any)

    const fd = makeFormData({ title: 'X', start_at: '2026-05-01T10:00:00Z' })
    const result = await createEvent({}, fd)
    expect(result.error).toBeDefined()
  })

  it('accepts __none__ sentinel values for optional fk fields', async () => {
    const fd = makeFormData({
      title: 'X',
      start_at: '2026-05-01T10:00:00Z',
      contact_id: '__none__',
      company_id: '__none__',
      deal_id: '__none__',
      assigned_to: '__none__',
    })
    const result = await createEvent({}, fd)
    expect(result.success).toBe(true)
  })
})

describe('updateEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when not authenticated', async () => {
    const { getOrgId } = await import('@/lib/actions/helpers')
    vi.mocked(getOrgId).mockResolvedValueOnce(null as any)

    const fd = makeFormData({ title: 'X', start_at: '2026-05-01T10:00:00Z' })
    const result = await updateEvent('event-123', {}, fd)
    expect(result.error).toBeDefined()
  })

  it('fails validation with bad contact_id uuid', async () => {
    const fd = makeFormData({
      title: 'X',
      start_at: '2026-05-01T10:00:00Z',
      contact_id: 'not-a-uuid',
    })
    const result = await updateEvent('event-123', {}, fd)
    expect(result.error).toBeDefined()
  })
})

describe('updateEventStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when not authenticated', async () => {
    const { getOrgId } = await import('@/lib/actions/helpers')
    vi.mocked(getOrgId).mockResolvedValueOnce(null as any)

    const result = await updateEventStatus('event-123', 'COMPLETED')
    expect(result.error).toBeDefined()
  })

  it('returns error when event not found', async () => {
    mockClient._chain.single.mockResolvedValueOnce({ data: null, error: null })
    const result = await updateEventStatus('missing-event', 'COMPLETED')
    expect(result.error).toBe('Event not found')
  })
})

describe('updateEventTime', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when not authenticated', async () => {
    const { getOrgId } = await import('@/lib/actions/helpers')
    vi.mocked(getOrgId).mockResolvedValueOnce(null as any)

    const result = await updateEventTime('event-123', '2026-05-01T10:00:00Z', null)
    expect(result.error).toBeDefined()
  })
})

describe('deleteEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when not authenticated', async () => {
    const { getOrgId } = await import('@/lib/actions/helpers')
    vi.mocked(getOrgId).mockResolvedValueOnce(null as any)

    const result = await deleteEvent('event-123')
    expect(result.error).toBeDefined()
  })
})
