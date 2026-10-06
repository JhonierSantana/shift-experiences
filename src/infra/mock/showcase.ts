import type { Media } from '@/core/domain'

/** Unsplash stand-in (free licence) with a gradient fallback, until each brand has its own photography. */
function stockPhoto(
  id: string,
  alt: string,
  fallback: string,
  { width, height }: { width: number; height: number },
): Media {
  return {
    alt,
    width,
    height,
    fallback: { kind: 'gradient', value: fallback },
    src: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${String(width)}&h=${String(height)}&q=70`,
  }
}

/** Decorative imagery for the experience selector (`alt: ''`: the cards already carry the text). */
export const showcaseMedia = {
  fashionMain: stockPhoto(
    '1558769132-cb1aea458c5e',
    '',
    'linear-gradient(165deg, #e4d3bd 0%, #b58b69 55%, #3d2d23 100%)',
    { width: 720, height: 900 },
  ),
  fashionDetail: stockPhoto(
    '1490481651871-ab68de25d43d',
    '',
    'linear-gradient(200deg, #9a4a2e 0%, #5a2330 100%)',
    { width: 480, height: 600 },
  ),
  food: stockPhoto(
    '1555939594-58d7cb561ad1',
    '',
    'linear-gradient(160deg, #ff9a3c 0%, #e2531f 55%, #5a1f0e 100%)',
    { width: 900, height: 700 },
  ),
  market: stockPhoto(
    '1441986300917-64674bd600d8',
    '',
    'linear-gradient(160deg, #dbe6ff 0%, #5b7bd6 60%, #1b2a5c 100%)',
    { width: 900, height: 700 },
  ),
} as const satisfies Record<string, Media>
