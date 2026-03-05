import { describe, it, expect } from 'vitest'
import {
  contactSchema,
  companySchema,
  dealSchema,
  noteSchema,
  invoiceLineItemSchema,
  invoiceSchema,
  tagSchema,
  sendInvoiceEmailSchema,
  recurringInvoiceSchema,
} from '@/lib/validations/crm'

describe('contactSchema', () => {
  it('accepts valid contact with required fields', () => {
    const result = contactSchema.safeParse({
      first_name: 'John',
      last_name: 'Doe',
    })
    expect(result.success).toBe(true)
  })

  it('accepts full contact', () => {
    const result = contactSchema.safeParse({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '555-1234',
      title: 'CEO',
      company_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      notes: 'Important client',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing first_name', () => {
    const result = contactSchema.safeParse({ last_name: 'Doe' })
    expect(result.success).toBe(false)
  })

  it('rejects missing last_name', () => {
    const result = contactSchema.safeParse({ first_name: 'John' })
    expect(result.success).toBe(false)
  })

  it('accepts empty optional strings', () => {
    const result = contactSchema.safeParse({
      first_name: 'John',
      last_name: 'Doe',
      email: '',
      phone: '',
      notes: '',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = contactSchema.safeParse({
      first_name: 'John',
      last_name: 'Doe',
      email: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })

  it('rejects first_name exceeding max length', () => {
    const result = contactSchema.safeParse({
      first_name: 'A'.repeat(101),
      last_name: 'Doe',
    })
    expect(result.success).toBe(false)
  })
})

describe('companySchema', () => {
  it('accepts valid company', () => {
    const result = companySchema.safeParse({ name: 'Acme Inc' })
    expect(result.success).toBe(true)
  })

  it('rejects missing name', () => {
    const result = companySchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects empty name', () => {
    const result = companySchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('accepts full company data', () => {
    const result = companySchema.safeParse({
      name: 'Acme Inc',
      domain: 'acme.com',
      industry: 'Tech',
      phone: '555-0000',
      email: 'info@acme.com',
      address: '123 Main St',
      notes: 'Enterprise client',
    })
    expect(result.success).toBe(true)
  })
})

describe('dealSchema', () => {
  it('accepts valid deal with required fields', () => {
    const result = dealSchema.safeParse({
      title: 'Big Deal',
      stage: 'LEAD',
    })
    expect(result.success).toBe(true)
  })

  it('defaults priority to MEDIUM', () => {
    const result = dealSchema.safeParse({
      title: 'Deal',
      stage: 'QUALIFIED',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.priority).toBe('MEDIUM')
    }
  })

  it('coerces string value to number', () => {
    const result = dealSchema.safeParse({
      title: 'Deal',
      stage: 'PROPOSAL',
      value: '5000',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.value).toBe(5000)
    }
  })

  it('rejects invalid stage', () => {
    const result = dealSchema.safeParse({
      title: 'Deal',
      stage: 'INVALID',
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative value', () => {
    const result = dealSchema.safeParse({
      title: 'Deal',
      stage: 'LEAD',
      value: -100,
    })
    expect(result.success).toBe(false)
  })
})

describe('noteSchema', () => {
  it('accepts valid note', () => {
    const result = noteSchema.safeParse({
      type: 'NOTE',
      title: 'Follow up',
    })
    expect(result.success).toBe(true)
  })

  it('accepts all note types', () => {
    for (const type of ['NOTE', 'EMAIL', 'CALL', 'MEETING']) {
      const result = noteSchema.safeParse({ type, title: 'Test' })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid type', () => {
    const result = noteSchema.safeParse({ type: 'INVALID', title: 'Test' })
    expect(result.success).toBe(false)
  })
})

describe('invoiceLineItemSchema', () => {
  it('accepts valid line item', () => {
    const result = invoiceLineItemSchema.safeParse({
      description: 'Web Development',
      quantity: 10,
      rate: 150,
      amount: 1500,
    })
    expect(result.success).toBe(true)
  })

  it('coerces string numbers', () => {
    const result = invoiceLineItemSchema.safeParse({
      description: 'Service',
      quantity: '5',
      rate: '100',
      amount: '500',
    })
    expect(result.success).toBe(true)
  })

  it('rejects zero quantity', () => {
    const result = invoiceLineItemSchema.safeParse({
      description: 'Service',
      quantity: 0,
      rate: 100,
      amount: 0,
    })
    expect(result.success).toBe(false)
  })
})

describe('invoiceSchema', () => {
  const validInvoice = {
    items: [{ description: 'Service', quantity: 1, rate: 100, amount: 100 }],
    subtotal: 100,
    total: 100,
    issue_date: '2026-01-01',
  }

  it('accepts valid invoice', () => {
    const result = invoiceSchema.safeParse(validInvoice)
    expect(result.success).toBe(true)
  })

  it('defaults tax_rate to 0', () => {
    const result = invoiceSchema.safeParse(validInvoice)
    if (result.success) {
      expect(result.data.tax_rate).toBe(0)
    }
  })

  it('defaults currency to USD', () => {
    const result = invoiceSchema.safeParse(validInvoice)
    if (result.success) {
      expect(result.data.currency).toBe('USD')
    }
  })

  it('rejects empty items array', () => {
    const result = invoiceSchema.safeParse({ ...validInvoice, items: [] })
    expect(result.success).toBe(false)
  })

  it('rejects missing issue_date', () => {
    const { issue_date, ...noDate } = validInvoice
    const result = invoiceSchema.safeParse(noDate)
    expect(result.success).toBe(false)
  })

  it('rejects tax_rate over 100', () => {
    const result = invoiceSchema.safeParse({ ...validInvoice, tax_rate: 101 })
    expect(result.success).toBe(false)
  })
})

describe('tagSchema', () => {
  it('accepts valid tag', () => {
    const result = tagSchema.safeParse({ name: 'VIP', color: '#FF5733' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid hex color', () => {
    const result = tagSchema.safeParse({ name: 'VIP', color: 'red' })
    expect(result.success).toBe(false)
  })

  it('rejects empty name', () => {
    const result = tagSchema.safeParse({ name: '', color: '#FF5733' })
    expect(result.success).toBe(false)
  })
})

describe('sendInvoiceEmailSchema', () => {
  it('accepts valid data', () => {
    const result = sendInvoiceEmailSchema.safeParse({
      invoiceId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      recipientEmail: 'client@example.com',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = sendInvoiceEmailSchema.safeParse({
      invoiceId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      recipientEmail: 'not-email',
    })
    expect(result.success).toBe(false)
  })
})

describe('recurringInvoiceSchema', () => {
  it('accepts valid recurring config', () => {
    const result = recurringInvoiceSchema.safeParse({
      source_invoice_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      frequency: 'MONTHLY',
      start_date: '2026-02-01',
    })
    expect(result.success).toBe(true)
  })

  it('accepts all frequencies', () => {
    for (const frequency of ['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']) {
      const result = recurringInvoiceSchema.safeParse({
        source_invoice_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        frequency,
        start_date: '2026-02-01',
      })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid frequency', () => {
    const result = recurringInvoiceSchema.safeParse({
      source_invoice_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      frequency: 'DAILY',
      start_date: '2026-02-01',
    })
    expect(result.success).toBe(false)
  })
})
