import { describe, it, expect } from 'vitest'
import { createNotificationSchema } from '@/lib/validations/notifications'

const TEST_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

describe('createNotificationSchema', () => {
  it('accepts valid notification', () => {
    const result = createNotificationSchema.safeParse({
      userId: TEST_UUID,
      orgId: TEST_UUID,
      title: 'New message received',
    })
    expect(result.success).toBe(true)
  })

  it('accepts full notification', () => {
    const result = createNotificationSchema.safeParse({
      userId: TEST_UUID,
      orgId: TEST_UUID,
      title: 'New form submission',
      body: 'Someone submitted the contact form',
      link: '/forms/123',
      icon: 'mail',
      sourceType: 'form',
      sourceId: TEST_UUID,
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing title', () => {
    const result = createNotificationSchema.safeParse({
      userId: TEST_UUID,
      orgId: TEST_UUID,
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty title', () => {
    const result = createNotificationSchema.safeParse({
      userId: TEST_UUID,
      orgId: TEST_UUID,
      title: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing userId', () => {
    const result = createNotificationSchema.safeParse({
      orgId: TEST_UUID,
      title: 'Test',
    })
    expect(result.success).toBe(false)
  })
})
