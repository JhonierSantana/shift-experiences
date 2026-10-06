// WCAG 2.x relative luminance / contrast ratio for #rrggbb colors.

function channel(value: number): number {
  const c = value / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(hex: string): number {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
  if (!match) throw new Error(`Expected #rrggbb color, got "${hex}"`)
  const [r, g, b] = match.slice(1).map((part) => channel(Number.parseInt(part, 16)))
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0)
}

export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05)
}

/** Foreground/background token pairs that must pass, with their WCAG AA minimum. */
export const REQUIRED_TOKEN_PAIRS = [
  { fg: '--shift-ink', bg: '--shift-surface', min: 4.5 },
  { fg: '--shift-ink', bg: '--shift-surface-raised', min: 4.5 },
  { fg: '--shift-ink-muted', bg: '--shift-surface', min: 4.5 },
  { fg: '--shift-ink-muted', bg: '--shift-surface-raised', min: 4.5 },
  { fg: '--shift-accent-ink', bg: '--shift-accent', min: 4.5 },
  // Non-text contrast (focus ring, accent used as UI boundary): 3:1.
  { fg: '--shift-focus', bg: '--shift-surface', min: 3 },
  { fg: '--shift-focus', bg: '--shift-surface-raised', min: 3 },
  { fg: '--shift-accent', bg: '--shift-surface', min: 3 },
  // Non-text contrast (SC 1.4.11): border used as the resting-state boundary of a
  // real UI component (chip, stepper, form field) rather than a decorative divider.
  { fg: '--shift-line-strong', bg: '--shift-surface', min: 3 },
  { fg: '--shift-line-strong', bg: '--shift-surface-raised', min: 3 },
] as const
