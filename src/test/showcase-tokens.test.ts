import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ExperienceId } from '@/engine'
import { EXPERIENCE_IDS, SHOWCASE } from '@/features/selector/model'

/**
 * The selector prints each brand's palette, font and motion. Those values are copies of the real
 * tokens, so this test keeps them honest: change a token and the selector must follow.
 */
const readTokens = (id: ExperienceId) =>
  readFileSync(join(import.meta.dirname, '..', 'features', id, 'tokens.css'), 'utf8')

const sheets: Readonly<Record<ExperienceId, string>> = {
  fashion: readTokens('fashion'),
  food: readTokens('food'),
  market: readTokens('market'),
}

function token(css: string, name: string): string {
  const match = new RegExp(`${name}: *([^;]+);`).exec(css)
  if (!match?.[1]) throw new Error(`Token ${name} not found`)
  return match[1].trim()
}

const numbers = (value: string) => (value.match(/-?\d*\.?\d+/g) ?? []).map(Number)

describe('selector showcase mirrors each tokens.css', () => {
  it.each(EXPERIENCE_IDS)('%s palette', (id) => {
    const css = sheets[id]
    expect(SHOWCASE[id].palette.map((color) => color.toLowerCase())).toEqual([
      token(css, '--shift-surface').toLowerCase(),
      token(css, '--shift-ink').toLowerCase(),
      token(css, '--shift-accent').toLowerCase(),
      token(css, '--shift-line-strong').toLowerCase(),
    ])
  })

  it.each(EXPERIENCE_IDS)('%s display font', (id) => {
    expect(token(sheets[id], '--shift-font-display')).toContain(`'${SHOWCASE[id].font}'`)
  })

  it.each(EXPERIENCE_IDS)('%s motion (duration and easing)', (id) => {
    const css = sheets[id]
    expect(numbers(SHOWCASE[id].motion)).toEqual([
      ...numbers(token(css, '--shift-duration-slow')),
      ...numbers(token(css, '--shift-ease')),
    ])
  })
})
