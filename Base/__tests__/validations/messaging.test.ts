import { describe, it, expect } from 'vitest'
import {
  messageTemplateSchema,
  composeMessageSchema,
} from '@/lib/validations/messaging'

describe('messageTemplateSchema', () => {
  it('accepts valid template', () => {
    const result = messageTemplateSchema.safeParse({
      name: 'Welcome Email',
      body: 'Hello {{name}}, welcome!',
    })
    expect(result.success).toBe(true)
  })

  it('defaults channel to EMAIL', () => {
    const result = messageTemplateSchema.safeParse({
      name: 'Template',
      body: 'Body text',
    })
    if (result.success) {
      expect(result.data.channel).toBe('EMAIL')
    }
  })

  it('accepts SMS channel', () => {
    const result = messageTemplateSchema.safeParse({
      name: 'SMS Template',
      body: 'Hi {{name}}',
      channel: 'SMS',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = messageTemplateSchema.safeParse({
      name: '',
      body: 'Body',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty body', () => {
    const result = messageTemplateSchema.safeParse({
      name: 'Template',
      body: '',
    })
    expect(result.success).toBe(false)
  })

  it('defaults variables to empty array', () => {
    const result = messageTemplateSchema.safeParse({
      name: 'Template',
      body: 'Body',
    })
    if (result.success) {
      expect(result.data.variables).toEqual([])
    }
  })
})

describe('composeMessageSchema', () => {
  it('accepts valid message', () => {
    const result = composeMessageSchema.safeParse({
      body: 'Hello there!',
      recipient_email: 'user@example.com',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid recipient email', () => {
    const result = composeMessageSchema.safeParse({
      body: 'Hello',
      recipient_email: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty body', () => {
    const result = composeMessageSchema.safeParse({
      body: '',
      recipient_email: 'user@example.com',
    })
    expect(result.success).toBe(false)
  })

  it('accepts optional subject', () => {
    const result = composeMessageSchema.safeParse({
      subject: 'Hello',
      body: 'Body text',
      recipient_email: 'user@example.com',
    })
    expect(result.success).toBe(true)
  })
})
