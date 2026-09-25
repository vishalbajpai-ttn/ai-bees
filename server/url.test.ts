import { describe, expect, it } from 'vitest'
import { parsePublicUrl } from './url.ts'

describe('parsePublicUrl', () => {
  it('normalizes a public HTTPS URL and removes its fragment', () => {
    expect(parsePublicUrl('https://example.com/audit#section')).toBe(
      'https://example.com/audit',
    )
  })

  it('does not double https when the protocol is already present', () => {
    expect(parsePublicUrl('https://www.tothenew.com')).toBe(
      'https://www.tothenew.com/',
    )
  })

  it('accepts a host without a protocol', () => {
    expect(parsePublicUrl('www.tothenew.com')).toBe('https://www.tothenew.com/')
  })

  it.each([
    'http://localhost:3000',
    'http://127.0.0.1',
    'http://10.0.0.2',
    'file:///tmp/report.html',
  ])('rejects non-public URL %s', (url) => {
    expect(() => parsePublicUrl(url)).toThrow()
  })
})
