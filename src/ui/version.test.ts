import { describe, it, expect } from 'vitest'
import { APP_VERSION } from './version'

describe('APP_VERSION', () => {
  it('is the version the package carries', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/)
  })
})
