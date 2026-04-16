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

const { createTask, updateTask, moveTask, assignTask, deleteTask } = await import('@/lib/actions/tasks')

const BOARD_ID = '11111111-1111-4111-8111-111111111111'
const COLUMN_ID = '22222222-2222-4222-8222-222222222222'
const NEW_COLUMN_ID = '33333333-3333-4333-8333-333333333333'
const USER_ID = '44444444-4444-4444-8444-444444444444'

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(data)) {
    fd.set(key, value)
  }
  return fd
}

describe('createTask', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClient._chain.single.mockResolvedValue({ data: { id: 'task-123' }, error: null })
  })

  it('succeeds with valid data', async () => {
    const fd = makeFormData({ title: 'Write docs', board_id: BOARD_ID, column_id: COLUMN_ID })
    const result = await createTask({}, fd)
    expect(result.success).toBe(true)
    expect(mockClient.from).toHaveBeenCalledWith('tasks')
  })

  it('fails with empty title', async () => {
    const fd = makeFormData({ title: '', board_id: BOARD_ID, column_id: COLUMN_ID })
    const result = await createTask({}, fd)
    expect(result.error).toBeDefined()
  })

  it('fails with missing board_id', async () => {
    const fd = makeFormData({ title: 'X', column_id: COLUMN_ID })
    const result = await createTask({}, fd)
    expect(result.error).toBeDefined()
  })

  it('fails with non-UUID column_id', async () => {
    const fd = makeFormData({ title: 'X', board_id: BOARD_ID, column_id: 'not-a-uuid' })
    const result = await createTask({}, fd)
    expect(result.error).toBeDefined()
  })

  it('returns error when not authenticated', async () => {
    const { getOrgId } = await import('@/lib/actions/helpers')
    vi.mocked(getOrgId).mockResolvedValueOnce(null as any)

    const fd = makeFormData({ title: 'X', board_id: BOARD_ID, column_id: COLUMN_ID })
    const result = await createTask({}, fd)
    expect(result.error).toBeDefined()
  })
})

describe('updateTask', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when not authenticated', async () => {
    const { getOrgId } = await import('@/lib/actions/helpers')
    vi.mocked(getOrgId).mockResolvedValueOnce(null as any)

    const fd = makeFormData({ title: 'X', board_id: BOARD_ID, column_id: COLUMN_ID })
    const result = await updateTask('task-123', BOARD_ID, {}, fd)
    expect(result.error).toBeDefined()
  })

  it('fails validation with bad assigned_to', async () => {
    const fd = makeFormData({
      title: 'X',
      board_id: BOARD_ID,
      column_id: COLUMN_ID,
      assigned_to: 'not-a-uuid',
    })
    const result = await updateTask('task-123', BOARD_ID, {}, fd)
    expect(result.error).toBeDefined()
  })
})

describe('moveTask', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when not authenticated', async () => {
    const { getOrgId } = await import('@/lib/actions/helpers')
    vi.mocked(getOrgId).mockResolvedValueOnce(null as any)

    const result = await moveTask('task-123', NEW_COLUMN_ID, 0, BOARD_ID)
    expect(result.error).toBeDefined()
  })

  it('returns error when task not found', async () => {
    mockClient._chain.single.mockResolvedValueOnce({ data: null, error: null })
    const result = await moveTask('missing-task', NEW_COLUMN_ID, 0, BOARD_ID)
    expect(result.error).toBe('Task not found')
  })
})

describe('assignTask', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when not authenticated', async () => {
    const { getOrgId } = await import('@/lib/actions/helpers')
    vi.mocked(getOrgId).mockResolvedValueOnce(null as any)

    const result = await assignTask('task-123', USER_ID, BOARD_ID)
    expect(result.error).toBeDefined()
  })

  it('returns error when task not found', async () => {
    mockClient._chain.single.mockResolvedValueOnce({ data: null, error: null })
    const result = await assignTask('missing-task', USER_ID, BOARD_ID)
    expect(result.error).toBe('Task not found')
  })
})

describe('deleteTask', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when not authenticated', async () => {
    const { getOrgId } = await import('@/lib/actions/helpers')
    vi.mocked(getOrgId).mockResolvedValueOnce(null as any)

    const result = await deleteTask('task-123', BOARD_ID)
    expect(result.error).toBeDefined()
  })
})
