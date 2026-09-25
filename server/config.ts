export const DEFAULT_CURSOR_MODEL = 'composer-2.5'

export function getCursorModel() {
  const configured = process.env.CURSOR_MODEL?.trim()
  return configured || DEFAULT_CURSOR_MODEL
}
