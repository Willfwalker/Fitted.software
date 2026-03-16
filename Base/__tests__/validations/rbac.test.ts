import { describe, it, expect } from 'vitest'
import { hasPermission, isAtLeast, type AppRole, type Permission } from '@/lib/rbac/permissions'

describe('hasPermission', () => {
  const matrix: [AppRole, Permission, boolean][] = [
    // MEMBER
    ['MEMBER', 'members:view', true],
    ['MEMBER', 'records:delete', false],
    ['MEMBER', 'features:request', false],
    ['MEMBER', 'invite_codes:manage', false],
    ['MEMBER', 'members:manage', false],
    ['MEMBER', 'modules:toggle', false],
    ['MEMBER', 'org:settings', false],

    // ADMIN
    ['ADMIN', 'members:view', true],
    ['ADMIN', 'records:delete', true],
    ['ADMIN', 'features:request', true],
    ['ADMIN', 'invite_codes:manage', true],
    ['ADMIN', 'members:manage', true],
    ['ADMIN', 'modules:toggle', false],
    ['ADMIN', 'org:settings', false],

    // OWNER
    ['OWNER', 'members:view', true],
    ['OWNER', 'records:delete', true],
    ['OWNER', 'features:request', true],
    ['OWNER', 'invite_codes:manage', true],
    ['OWNER', 'members:manage', true],
    ['OWNER', 'modules:toggle', true],
    ['OWNER', 'org:settings', true],
  ]

  it.each(matrix)('%s has %s = %s', (role, permission, expected) => {
    expect(hasPermission(role, permission)).toBe(expected)
  })

  it('returns false for null/undefined role', () => {
    expect(hasPermission(null, 'records:delete')).toBe(false)
    expect(hasPermission(undefined, 'members:view')).toBe(false)
  })
})

describe('isAtLeast', () => {
  it('OWNER is at least OWNER', () => {
    expect(isAtLeast('OWNER', 'OWNER')).toBe(true)
  })

  it('OWNER is at least ADMIN', () => {
    expect(isAtLeast('OWNER', 'ADMIN')).toBe(true)
  })

  it('OWNER is at least MEMBER', () => {
    expect(isAtLeast('OWNER', 'MEMBER')).toBe(true)
  })

  it('ADMIN is at least ADMIN', () => {
    expect(isAtLeast('ADMIN', 'ADMIN')).toBe(true)
  })

  it('ADMIN is at least MEMBER', () => {
    expect(isAtLeast('ADMIN', 'MEMBER')).toBe(true)
  })

  it('ADMIN is NOT at least OWNER', () => {
    expect(isAtLeast('ADMIN', 'OWNER')).toBe(false)
  })

  it('MEMBER is at least MEMBER', () => {
    expect(isAtLeast('MEMBER', 'MEMBER')).toBe(true)
  })

  it('MEMBER is NOT at least ADMIN', () => {
    expect(isAtLeast('MEMBER', 'ADMIN')).toBe(false)
  })

  it('MEMBER is NOT at least OWNER', () => {
    expect(isAtLeast('MEMBER', 'OWNER')).toBe(false)
  })

  it('returns false for null/undefined role', () => {
    expect(isAtLeast(null, 'MEMBER')).toBe(false)
    expect(isAtLeast(undefined, 'MEMBER')).toBe(false)
  })
})
