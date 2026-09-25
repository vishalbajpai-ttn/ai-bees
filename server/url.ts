import { isIP } from 'node:net'
import { toHttpsUrl } from '../shared/url.ts'

const PRIVATE_IPV4 = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\./,
]

export function parsePublicUrl(value: unknown) {
  if (typeof value !== 'string' || value.length > 2048) {
    throw new Error('Enter a valid public website URL.')
  }

  const trimmed = value.trim()
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^https?:/i.test(trimmed)) {
    throw new Error('Only HTTP and HTTPS URLs can be audited.')
  }

  let url: URL
  try {
    url = new URL(toHttpsUrl(trimmed))
  } catch {
    throw new Error('Enter a valid website address, such as example.com.')
  }

  const hostname = url.hostname.toLowerCase()
  const isLocalName =
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname === '[::1]'
  const isPrivateIp =
    (isIP(hostname) === 4 &&
      PRIVATE_IPV4.some((pattern) => pattern.test(hostname))) ||
    (isIP(hostname.replaceAll(/^\[|\]$/g, '')) === 6 &&
      /^(\[)?(fc|fd|fe8|fe9|fea|feb|::)/i.test(hostname))

  if (isLocalName || isPrivateIp) {
    throw new Error('Private and local network addresses cannot be audited.')
  }

  url.hash = ''
  return url.toString()
}
