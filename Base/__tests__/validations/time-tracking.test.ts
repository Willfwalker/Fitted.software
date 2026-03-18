import { describe, it, expect } from 'vitest'
import { timeEntrySchema, timerStartSchema, timerStopSchema } from '@/lib/validations/time-tracking'

describe('timeEntrySchema', () => {
  it('accepts valid manual time entry', () => {
    const result = timeEntrySchema.safeParse({
      duration_minutes: 60,
      date: '2026-03-17',
      description: 'Worked on feature',
      billable: true,
      rate: 150,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.duration_minutes).toBe(60)
      expect(result.data.billable).toBe(true)
      expect(result.data.rate).toBe(150)
    }
  })

  it('rejects zero duration', () => {
    const result = timeEntrySchema.safeParse({
      duration_minutes: 0,
      date: '2026-03-17',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing date', () => {
    const result = timeEntrySchema.safeParse({
      duration_minutes: 30,
      date: '',
    })
    expect(result.success).toBe(false)
  })

  it('coerces string numbers', () => {
    const result = timeEntrySchema.safeParse({
      duration_minutes: '45',
      date: '2026-03-17',
      rate: '100.50',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.duration_minutes).toBe(45)
      expect(result.data.rate).toBe(100.5)
    }
  })

  it('defaults billable to true', () => {
    const result = timeEntrySchema.safeParse({
      duration_minutes: 30,
      date: '2026-03-17',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.billable).toBe(true)
    }
  })

  it('accepts optional entity IDs', () => {
    const result = timeEntrySchema.safeParse({
      duration_minutes: 30,
      date: '2026-03-17',
      task_id: '550e8400-e29b-41d4-a716-446655440000',
      deal_id: '',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid UUID for task_id', () => {
    const result = timeEntrySchema.safeParse({
      duration_minutes: 30,
      date: '2026-03-17',
      task_id: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })
})

describe('timerStartSchema', () => {
  it('accepts valid timer start', () => {
    const result = timerStartSchema.safeParse({
      task_id: '550e8400-e29b-41d4-a716-446655440000',
      billable: true,
      rate: 150,
    })
    expect(result.success).toBe(true)
  })

  it('defaults billable and rate', () => {
    const result = timerStartSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.billable).toBe(true)
      expect(result.data.rate).toBe(0)
    }
  })
})

describe('timerStopSchema', () => {
  it('accepts valid UUID', () => {
    const result = timerStopSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing id', () => {
    const result = timerStopSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
