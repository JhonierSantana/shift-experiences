import { REQUIRED_TOKEN_PAIRS, contrastRatio } from '@/design-system/contrast'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cwd } from 'node:process'

// Read from disk: Vitest runs with css disabled, so `?raw` CSS imports come back empty.
const read = (path: string) => readFileSync(resolve(cwd(), 'src', path), 'utf8')

// Reads the first (base, non-media-query) declaration of each color token.
function colorTokens(css: string): Map<string, string> {
  const tokens = new Map<string, string>()
  for (const [, name, value] of css.matchAll(/(--shift-[\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)) {
    if (name && value && !tokens.has(name)) tokens.set(name, value)
  }
  return tokens
}

const sheets = {
  default: read('design-system/tokens.css'),
  selector: read('features/selector/tokens.css'),
  fashion: read('features/fashion/tokens.css'),
  food: read('features/food/tokens.css'),
  market: read('features/market/tokens.css'),
}

describe.each(Object.entries(sheets))('%s tokens', (_, css) => {
  const tokens = colorTokens(css)

  it.each(REQUIRED_TOKEN_PAIRS)('$fg on $bg meets $min:1', ({ fg, bg, min }) => {
    const foreground = tokens.get(fg)
    const background = tokens.get(bg)
    expect(foreground, `${fg} missing`).toBeDefined()
    expect(background, `${bg} missing`).toBeDefined()
    expect(contrastRatio(foreground ?? '', background ?? '')).toBeGreaterThanOrEqual(min)
  })
})
