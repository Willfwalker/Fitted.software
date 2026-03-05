import { describe, it, expect } from 'vitest'
import {
  formSchema,
  formFieldSchema,
  buildSubmissionValidator,
} from '@/lib/validations/forms'

const TEST_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

describe('formFieldSchema', () => {
  it('accepts valid text field', () => {
    const result = formFieldSchema.safeParse({
      id: TEST_UUID,
      type: 'TEXT',
      label: 'Full Name',
    })
    expect(result.success).toBe(true)
  })

  it('accepts all field types', () => {
    const types = [
      'TEXT', 'TEXTAREA', 'EMAIL', 'PHONE', 'NUMBER', 'DATE',
      'SELECT', 'MULTI_SELECT', 'CHECKBOX', 'RADIO', 'FILE', 'HIDDEN',
    ]
    for (const type of types) {
      const result = formFieldSchema.safeParse({
        id: TEST_UUID,
        type,
        label: 'Test',
      })
      expect(result.success).toBe(true)
    }
  })

  it('defaults required to false', () => {
    const result = formFieldSchema.safeParse({
      id: TEST_UUID,
      type: 'TEXT',
      label: 'Name',
    })
    if (result.success) {
      expect(result.data.required).toBe(false)
    }
  })

  it('rejects invalid type', () => {
    const result = formFieldSchema.safeParse({
      id: TEST_UUID,
      type: 'INVALID',
      label: 'Test',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty label', () => {
    const result = formFieldSchema.safeParse({
      id: TEST_UUID,
      type: 'TEXT',
      label: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('formSchema', () => {
  it('accepts valid form with name only', () => {
    const result = formSchema.safeParse({ name: 'Contact Form' })
    expect(result.success).toBe(true)
  })

  it('defaults fields to empty array', () => {
    const result = formSchema.safeParse({ name: 'Form' })
    if (result.success) {
      expect(result.data.fields).toEqual([])
    }
  })

  it('accepts form with fields', () => {
    const result = formSchema.safeParse({
      name: 'Survey',
      description: 'Customer survey',
      fields: [
        { id: TEST_UUID, type: 'TEXT', label: 'Name', required: true },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = formSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })
})

describe('buildSubmissionValidator', () => {
  it('builds schema for required text field', () => {
    const fields = [
      { id: 'field-1', type: 'TEXT' as const, label: 'Name', required: true, options: [] },
    ]
    const schema = buildSubmissionValidator(fields as any)

    expect(schema.safeParse({ 'field-1': 'John' }).success).toBe(true)
    expect(schema.safeParse({}).success).toBe(false)
  })

  it('builds schema for optional text field', () => {
    const fields = [
      { id: 'field-1', type: 'TEXT' as const, label: 'Name', required: false, options: [] },
    ]
    const schema = buildSubmissionValidator(fields as any)

    expect(schema.safeParse({}).success).toBe(true)
    expect(schema.safeParse({ 'field-1': '' }).success).toBe(true)
  })

  it('validates EMAIL field type', () => {
    const fields = [
      { id: 'field-1', type: 'EMAIL' as const, label: 'Email', required: true, options: [] },
    ]
    const schema = buildSubmissionValidator(fields as any)

    expect(schema.safeParse({ 'field-1': 'test@example.com' }).success).toBe(true)
    expect(schema.safeParse({ 'field-1': 'not-email' }).success).toBe(false)
  })

  it('coerces NUMBER field type', () => {
    const fields = [
      { id: 'field-1', type: 'NUMBER' as const, label: 'Age', required: true, options: [] },
    ]
    const schema = buildSubmissionValidator(fields as any)

    expect(schema.safeParse({ 'field-1': '25' }).success).toBe(true)
  })

  it('handles CHECKBOX as boolean', () => {
    const fields = [
      { id: 'field-1', type: 'CHECKBOX' as const, label: 'Agree', required: true, options: [] },
    ]
    const schema = buildSubmissionValidator(fields as any)

    expect(schema.safeParse({ 'field-1': true }).success).toBe(true)
    expect(schema.safeParse({ 'field-1': 'true' }).success).toBe(true)
  })

  it('handles MULTI_SELECT as string array', () => {
    const fields = [
      { id: 'field-1', type: 'MULTI_SELECT' as const, label: 'Colors', required: true, options: ['Red', 'Blue'] },
    ]
    const schema = buildSubmissionValidator(fields as any)

    expect(schema.safeParse({ 'field-1': ['Red', 'Blue'] }).success).toBe(true)
  })

  it('skips HIDDEN fields', () => {
    const fields = [
      { id: 'field-1', type: 'HIDDEN' as const, label: 'Source', required: false, options: [] },
      { id: 'field-2', type: 'TEXT' as const, label: 'Name', required: true, options: [] },
    ]
    const schema = buildSubmissionValidator(fields as any)

    // Should not require field-1
    expect(schema.safeParse({ 'field-2': 'John' }).success).toBe(true)
  })
})
