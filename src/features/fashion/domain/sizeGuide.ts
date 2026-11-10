import type { FashionProduct } from '@/core/domain'

export interface SizeGuide {
  readonly title: string
  readonly columns: readonly string[]
  readonly rows: readonly { readonly size: string; readonly values: readonly string[] }[]
  readonly tip: string
}

const LETTER: Record<string, readonly [string, string, string]> = {
  XS: ['80 – 84', '60 – 64', '86 – 90'],
  S: ['85 – 89', '65 – 69', '91 – 95'],
  M: ['90 – 94', '70 – 74', '96 – 100'],
  L: ['95 – 99', '75 – 79', '101 – 105'],
  XL: ['100 – 104', '80 – 84', '106 – 110'],
  'S/M': ['85 – 94', '65 – 74', '91 – 100'],
  'L/XL': ['95 – 104', '75 – 84', '101 – 110'],
}

const WAIST: Record<string, readonly [string, string]> = {
  '36': ['66', '92'],
  '38': ['70', '96'],
  '40': ['74', '100'],
  '42': ['78', '104'],
  '44': ['82', '108'],
}

const SHOE: Record<string, string> = {
  '36': '23,0',
  '37': '23,7',
  '38': '24,3',
  '39': '25,0',
  '40': '25,7',
  '41': '26,3',
}

const GARMENT_TIP =
  'Mide sobre la ropa interior, con la cinta paralela al suelo. Entre dos tallas, elige la mayor para un ajuste holgado.'

/** Measurement table matching the product's size run; null for one-size pieces. */
export function sizeGuideFor(product: FashionProduct): SizeGuide | null {
  const { sizes } = product
  if (sizes.every((s) => s === 'Única')) return null

  if (sizes.includes('85')) {
    return {
      title: 'Cinturón',
      columns: ['Largo total (cm)'],
      rows: sizes.map((size) => ({ size, values: [String(Number(size) + 15)] })),
      tip: 'La talla corresponde a tu cintura en centímetros.',
    }
  }
  if (sizes.includes('41')) {
    return {
      title: 'Calzado',
      columns: ['Largo del pie (cm)'],
      rows: sizes.map((size) => ({ size, values: [SHOE[size] ?? '—'] })),
      tip: 'Mide tu pie de pie sobre una hoja, del talón al dedo más largo.',
    }
  }
  if (sizes.some((s) => s in WAIST)) {
    return {
      title: 'Pantalones y faldas',
      columns: ['Cintura (cm)', 'Cadera (cm)'],
      rows: sizes.map((size) => ({ size, values: [...(WAIST[size] ?? ['—', '—'])] })),
      tip: GARMENT_TIP,
    }
  }
  return {
    title: 'Prendas',
    columns: ['Busto (cm)', 'Cintura (cm)', 'Cadera (cm)'],
    rows: sizes.map((size) => ({ size, values: [...(LETTER[size] ?? ['—', '—', '—'])] })),
    tip: GARMENT_TIP,
  }
}

export const FIT_LABELS: Record<FashionProduct['fit'], string> = {
  slim: 'Entallado: sigue la silueta. Si dudas, elige una talla más.',
  regular: 'Regular: caída recta, cómodo sin volumen.',
  relaxed: 'Holgado: amplitud extra en hombros y torso.',
  oversized: 'Oversize: volumen intencional; una talla menos lo acerca al cuerpo.',
}
