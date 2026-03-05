import { describe, it, expect } from 'vitest'
import {
  boardSchema,
  boardColumnSchema,
  taskSchema,
  labelSchema,
} from '@/lib/validations/tasks'

const TEST_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

describe('boardSchema', () => {
  it('accepts valid board', () => {
    const result = boardSchema.safeParse({ name: 'Sprint Board' })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = boardSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects name over 200 chars', () => {
    const result = boardSchema.safeParse({ name: 'A'.repeat(201) })
    expect(result.success).toBe(false)
  })

  it('accepts optional description', () => {
    const result = boardSchema.safeParse({
      name: 'Board',
      description: 'A description',
    })
    expect(result.success).toBe(true)
  })
})

describe('boardColumnSchema', () => {
  it('accepts valid column', () => {
    const result = boardColumnSchema.safeParse({ name: 'To Do' })
    expect(result.success).toBe(true)
  })

  it('defaults position to 0', () => {
    const result = boardColumnSchema.safeParse({ name: 'To Do' })
    if (result.success) {
      expect(result.data.position).toBe(0)
    }
  })

  it('accepts wip_limit', () => {
    const result = boardColumnSchema.safeParse({
      name: 'In Progress',
      wip_limit: 5,
    })
    expect(result.success).toBe(true)
  })

  it('rejects wip_limit of 0', () => {
    const result = boardColumnSchema.safeParse({
      name: 'In Progress',
      wip_limit: 0,
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid hex color', () => {
    const result = boardColumnSchema.safeParse({
      name: 'Done',
      color: '#00FF00',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid hex color', () => {
    const result = boardColumnSchema.safeParse({
      name: 'Done',
      color: 'green',
    })
    expect(result.success).toBe(false)
  })
})

describe('taskSchema', () => {
  const validTask = {
    title: 'Fix bug',
    board_id: TEST_UUID,
    column_id: TEST_UUID,
  }

  it('accepts valid task with required fields', () => {
    const result = taskSchema.safeParse(validTask)
    expect(result.success).toBe(true)
  })

  it('defaults priority to NONE', () => {
    const result = taskSchema.safeParse(validTask)
    if (result.success) {
      expect(result.data.priority).toBe('NONE')
    }
  })

  it('defaults status to TODO', () => {
    const result = taskSchema.safeParse(validTask)
    if (result.success) {
      expect(result.data.status).toBe('TODO')
    }
  })

  it('rejects missing board_id', () => {
    const { board_id, ...noBoard } = validTask
    const result = taskSchema.safeParse(noBoard)
    expect(result.success).toBe(false)
  })

  it('rejects missing column_id', () => {
    const { column_id, ...noCol } = validTask
    const result = taskSchema.safeParse(noCol)
    expect(result.success).toBe(false)
  })

  it('accepts all priority levels', () => {
    for (const priority of ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT']) {
      const result = taskSchema.safeParse({ ...validTask, priority })
      expect(result.success).toBe(true)
    }
  })

  it('accepts all status values', () => {
    for (const status of ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED']) {
      const result = taskSchema.safeParse({ ...validTask, status })
      expect(result.success).toBe(true)
    }
  })

  it('rejects title over 500 chars', () => {
    const result = taskSchema.safeParse({ ...validTask, title: 'A'.repeat(501) })
    expect(result.success).toBe(false)
  })
})

describe('labelSchema', () => {
  it('accepts valid label', () => {
    const result = labelSchema.safeParse({ name: 'Bug', color: '#FF0000' })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = labelSchema.safeParse({ name: '', color: '#FF0000' })
    expect(result.success).toBe(false)
  })

  it('rejects name over 50 chars', () => {
    const result = labelSchema.safeParse({ name: 'A'.repeat(51), color: '#FF0000' })
    expect(result.success).toBe(false)
  })

  it('rejects missing color', () => {
    const result = labelSchema.safeParse({ name: 'Bug' })
    expect(result.success).toBe(false)
  })
})
