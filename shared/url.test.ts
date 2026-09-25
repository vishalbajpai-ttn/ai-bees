import { describe, expect, it } from 'vitest'
import { stripUrlProtocol, toHttpsUrl } from './url.ts'

describe('stripUrlProtocol', () => {
  it('leaves a host-only value unchanged', () => {
    expect(stripUrlProtocol('www.tothenew.com')).toBe('www.tothenew.com')
  })

  it('strips a pasted or autocompleted https URL', () => {
    expect(stripUrlProtocol('https://www.tothenew.com')).toBe('www.tothenew.com')
  })

  it('strips a duplicated protocol', () => {
    expect(stripUrlProtocol('https://https://www.cloudkeeper.co')).toBe(
      'www.cloudkeeper.co',
    )
  })
})

describe('toHttpsUrl', () => {
  it('builds one https URL from a host', () => {
    expect(toHttpsUrl('www.tothenew.com')).toBe('https://www.tothenew.com')
  })

  it('does not double https when the value already includes it', () => {
    expect(toHttpsUrl('https://www.tothenew.com/pricing')).toBe(
      'https://www.tothenew.com/pricing',
    )
  })
})
