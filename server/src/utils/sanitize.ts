const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;'
}

const HTML_ENTITY_PATTERN = /[&<>"'/]/g

export function sanitizeString(input: string): string {
  return input.replace(HTML_ENTITY_PATTERN, char => HTML_ENTITIES[char]).trim()
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj }
  for (const key of Object.keys(sanitized)) {
    const value = sanitized[key]
    if (typeof value === 'string') {
      ;(sanitized as Record<string, unknown>)[key] = sanitizeString(value)
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      ;(sanitized as Record<string, unknown>)[key] = sanitizeObject(
        value as Record<string, unknown>
      )
    }
  }
  return sanitized
}
