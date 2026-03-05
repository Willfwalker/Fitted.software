import { describe, it, expect } from 'vitest'
import { calendarEventSchema } from '@/lib/validations/scheduling'

describe('calendarEventSchema', () => {
  it('accepts valid event', () => {
    const result = calendarEventSchema.safeParse({
      title: 'Team Meeting',
      start_at: '2026-03-04T10:00:00Z',
    })
    expect(result.success).toBe(true)
  })

  it('defaults status to SCHEDULED', () => {
    const result = calendarEventSchema.safeParse({
      title: 'Event',
      start_at: '2026-03-04T10:00:00Z',
    })
    if (result.success) {
      expect(result.data.status).toBe('SCHEDULED')
    }
  })

  it('defaults all_day to false', () => {
    const result = calendarEventSchema.safeParse({
      title: 'Event',
      start_at: '2026-03-04T10:00:00Z',
    })
    if (result.success) {
      expect(result.data.all_day).toBe(false)
    }
  })

  it('accepts all status values', () => {
    for (const status of ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']) {
      const result = calendarEventSchema.safeParse({
        title: 'Event',
        start_at: '2026-03-04T10:00:00Z',
        status,
      })
      expect(result.success).toBe(true)
    }
  })

  it('accepts __none__ for FK fields', () => {
    const result = calendarEventSchema.safeParse({
      title: 'Event',
      start_at: '2026-03-04T10:00:00Z',
      contact_id: '__none__',
      company_id: '__none__',
      deal_id: '__none__',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty title', () => {
    const result = calendarEventSchema.safeParse({
      title: '',
      start_at: '2026-03-04T10:00:00Z',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing start_at', () => {
    const result = calendarEventSchema.safeParse({ title: 'Event' })
    expect(result.success).toBe(false)
  })
})
