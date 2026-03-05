import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient, TEST_ORG_ID, TEST_USER_ID } from '../mocks/supabase'

const mockClient = createMockSupabaseClient()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockClient),
}))

vi.mock('@/lib/actions/helpers', () => ({
  getOrgId: vi.fn().mockResolvedValue({ orgId: TEST_ORG_ID, userId: TEST_USER_ID }),
}))

const { createInvoice, updateInvoiceStatus, deleteInvoice } = await import('@/lib/actions/invoices')

const validInvoiceData = {
  items: [{ description: 'Web Dev', quantity: 10, rate: 150, amount: 1500 }],
  subtotal: 1500,
  tax_rate: 0,
  tax_amount: 0,
  total: 1500,
  issue_date: '2026-01-15',
}

describe('createInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClient._chain.single.mockResolvedValue({ data: { id: 'inv-123' }, error: null })
    mockClient.rpc.mockResolvedValue({ data: 'INV-001', error: null })
  })

  it('succeeds with valid data', async () => {
    const result = await createInvoice(validInvoiceData)
    expect(result.invoiceId).toBeDefined()
    expect(mockClient.from).toHaveBeenCalledWith('invoices')
  })

  it('returns error when not authenticated', async () => {
    const { getOrgId } = await import('@/lib/actions/helpers')
    vi.mocked(getOrgId).mockResolvedValueOnce(null as any)

    const result = await createInvoice(validInvoiceData)
    expect(result.error).toBeDefined()
  })

  it('fails with empty items array', async () => {
    const result = await createInvoice({ ...validInvoiceData, items: [] })
    expect(result.error).toBeDefined()
  })

  it('fails with missing issue_date', async () => {
    const { issue_date, ...noDate } = validInvoiceData
    const result = await createInvoice(noDate as any)
    expect(result.error).toBeDefined()
  })
})

describe('updateInvoiceStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when not authenticated', async () => {
    const { getOrgId } = await import('@/lib/actions/helpers')
    vi.mocked(getOrgId).mockResolvedValueOnce(null as any)

    const result = await updateInvoiceStatus('inv-123', 'SENT' as any)
    expect(result.error).toBeDefined()
  })
})

describe('deleteInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when not authenticated', async () => {
    const { getOrgId } = await import('@/lib/actions/helpers')
    vi.mocked(getOrgId).mockResolvedValueOnce(null as any)

    const result = await deleteInvoice('inv-123')
    expect(result.error).toBeDefined()
  })
})
