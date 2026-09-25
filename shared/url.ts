/** Keep the visible field as host + path. The UI already shows https://. */
export function stripUrlProtocol(value: string) {
  return value
    .trim()
    .replace(/^(https?:\/\/)+/i, '')
    .replace(/^\/+/, '')
}

export function toHttpsUrl(value: string) {
  return `https://${stripUrlProtocol(value)}`
}
