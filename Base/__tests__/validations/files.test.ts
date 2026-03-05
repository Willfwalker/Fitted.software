import { describe, it, expect } from 'vitest'
import {
  fileMetadataSchema,
  moveFileSchema,
  renameFileSchema,
  attachFileSchema,
} from '@/lib/validations/files'

const TEST_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

describe('fileMetadataSchema', () => {
  it('accepts valid metadata', () => {
    const result = fileMetadataSchema.safeParse({ name: 'document.pdf' })
    expect(result.success).toBe(true)
  })

  it('defaults folder to /', () => {
    const result = fileMetadataSchema.safeParse({ name: 'file.txt' })
    if (result.success) {
      expect(result.data.folder).toBe('/')
    }
  })

  it('rejects empty name', () => {
    const result = fileMetadataSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })
})

describe('moveFileSchema', () => {
  it('accepts valid folder', () => {
    const result = moveFileSchema.safeParse({ folder: '/documents' })
    expect(result.success).toBe(true)
  })

  it('rejects empty folder', () => {
    const result = moveFileSchema.safeParse({ folder: '' })
    expect(result.success).toBe(false)
  })
})

describe('renameFileSchema', () => {
  it('accepts valid name', () => {
    const result = renameFileSchema.safeParse({ name: 'new-name.pdf' })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = renameFileSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })
})

describe('attachFileSchema', () => {
  it('accepts valid attachment', () => {
    const result = attachFileSchema.safeParse({
      file_id: TEST_UUID,
      entity_type: 'contact',
      entity_id: TEST_UUID,
    })
    expect(result.success).toBe(true)
  })

  it('accepts all entity types', () => {
    const types = ['contact', 'company', 'deal', 'invoice', 'task', 'event', 'form_submission']
    for (const entity_type of types) {
      const result = attachFileSchema.safeParse({
        file_id: TEST_UUID,
        entity_type,
        entity_id: TEST_UUID,
      })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid entity type', () => {
    const result = attachFileSchema.safeParse({
      file_id: TEST_UUID,
      entity_type: 'invalid',
      entity_id: TEST_UUID,
    })
    expect(result.success).toBe(false)
  })
})
