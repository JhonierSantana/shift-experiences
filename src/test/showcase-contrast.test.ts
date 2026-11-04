import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { contrastRatio } from '@/design-system/contrast'
import { EXPERIENCE_IDS, SHOWCASE } from '@/features/selector/model'

/**
 * Colors the selector invents on its own (the light brand accents and the active buttons) are not
 * covered by tokens-contrast.test.ts, so they get their own WCAG AA check here.
 */
const selectorTokens = readFileSync(
  join(import.meta.dirname, '..', 'features', 'selector', 'tokens.css'),
  'utf8',
)
const stage = /--shift-surface: *(#[0-9a-f]{6});/i.exec(selectorTokens)?.[1]
if (!stage) throw new Error('Selector --shift-surface not found')

describe('selector showcase colors meet WCAG AA', () => {
  it.each(EXPERIENCE_IDS)('%s: rotating word (accent on the dark stage) is readable text', (id) => {
    expect(contrastRatio(SHOWCASE[id].accent, stage)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(EXPERIENCE_IDS)('%s: active button text on the brand color is readable', (id) => {
    const [surface, , accent] = SHOWCASE[id].palette
    expect(contrastRatio(surface, accent)).toBeGreaterThanOrEqual(4.5)
  })
})
