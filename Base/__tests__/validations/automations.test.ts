import { describe, it, expect } from 'vitest'
import { automationSchema } from '@/lib/validations/automations'

describe('automationSchema', () => {
  it('accepts valid automation', () => {
    const result = automationSchema.safeParse({
      name: 'Notify on deal won',
      description: 'Sends an email when a deal is won',
      trigger_type: 'DEAL_STAGE_CHANGED',
      trigger_config: { to_stage: 'WON' },
      action_type: 'SEND_EMAIL',
      action_config: { subject: 'Deal won!', body: 'Congrats' },
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Notify on deal won')
      expect(result.data.trigger_type).toBe('DEAL_STAGE_CHANGED')
      expect(result.data.action_type).toBe('SEND_EMAIL')
      expect(result.data.enabled).toBe(true)
    }
  })

  it('rejects empty name', () => {
    const result = automationSchema.safeParse({
      name: '',
      trigger_type: 'DEAL_STAGE_CHANGED',
      action_type: 'CREATE_TASK',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid trigger_type', () => {
    const result = automationSchema.safeParse({
      name: 'Test',
      trigger_type: 'INVALID_TRIGGER',
      action_type: 'CREATE_TASK',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid action_type', () => {
    const result = automationSchema.safeParse({
      name: 'Test',
      trigger_type: 'DEAL_STAGE_CHANGED',
      action_type: 'INVALID_ACTION',
    })
    expect(result.success).toBe(false)
  })

  it('defaults trigger_config and action_config to empty objects', () => {
    const result = automationSchema.safeParse({
      name: 'Minimal',
      trigger_type: 'FORM_SUBMITTED',
      action_type: 'SEND_NOTIFICATION',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.trigger_config).toEqual({})
      expect(result.data.action_config).toEqual({})
    }
  })

  it('defaults enabled to true', () => {
    const result = automationSchema.safeParse({
      name: 'Test',
      trigger_type: 'TIME_LOGGED',
      action_type: 'CREATE_TASK',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.enabled).toBe(true)
    }
  })

  it('accepts all valid trigger types', () => {
    const triggers = [
      'DEAL_STAGE_CHANGED',
      'TASK_STATUS_CHANGED',
      'INVOICE_STATUS_CHANGED',
      'FORM_SUBMITTED',
      'TIME_LOGGED',
      'PAYMENT_RECEIVED',
      'EMAIL_RECEIVED',
    ]
    for (const t of triggers) {
      const result = automationSchema.safeParse({
        name: 'Test',
        trigger_type: t,
        action_type: 'SEND_NOTIFICATION',
      })
      expect(result.success).toBe(true)
    }
  })

  it('accepts all valid action types', () => {
    const actions = [
      'CREATE_TASK',
      'SEND_EMAIL',
      'CREATE_INVOICE',
      'SEND_NOTIFICATION',
      'UPDATE_DEAL_STAGE',
      'CREATE_EVENT',
    ]
    for (const a of actions) {
      const result = automationSchema.safeParse({
        name: 'Test',
        trigger_type: 'DEAL_STAGE_CHANGED',
        action_type: a,
      })
      expect(result.success).toBe(true)
    }
  })
})
