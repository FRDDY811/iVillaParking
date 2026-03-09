/** Parses a string to int, clamped between min and max. Returns defaultVal if parsing fails. */
export function parseIntClamped(
  value: string | undefined,
  defaultVal: number,
  min = 1,
  max = Infinity
): number {
  const parsed = parseInt(value as string, 10)
  if (isNaN(parsed)) return defaultVal
  return Math.min(Math.max(parsed, min), max)
}
