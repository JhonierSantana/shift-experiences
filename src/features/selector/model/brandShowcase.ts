import type { ExperienceId } from '@/engine'
import type { showcaseMedia } from '@/infra/mock'

/**
 * Selector-owned copy of what each brand looks like, used by the hero, the doors and the demo.
 * The palette, display font and motion values mirror each experience's `tokens.css` (the real
 * source of truth): `src/test/showcase-tokens.test.ts` fails if they drift apart.
 */
export interface BrandFact {
  readonly label: string
  readonly value: string
}

export interface BrandShowcase {
  /** Tailwind classes that set the brand's name on its door (the one brand-owned type on a door). */
  readonly nameFont: string
  /** Light variant of the brand accent, readable on the selector's dark stage (borders, light). */
  readonly accent: string
  /** Two sentences that say what the business is, shown on its card's folder. */
  readonly blurb: string
  /** Three short facts that make the business recognisable, shown as small cards on its door. */
  readonly facts: readonly [BrandFact, BrandFact, BrandFact]
  readonly product: {
    readonly title: string
    readonly meta: string
    readonly price: string
    readonly action: string
    readonly media: keyof typeof showcaseMedia
  }
  readonly font: string
  readonly radius: string
  /** surface, ink, accent, line-strong: same order as the inspector reads them. */
  readonly palette: readonly [surface: string, ink: string, accent: string, line: string]
  readonly motion: string
  readonly navigation: string
  readonly data: string
  readonly movement: string
}

export const SHOWCASE: Readonly<Record<ExperienceId, BrandShowcase>> = {
  fashion: {
    blurb:
      'Una boutique de autor donde cada prenda tiene su talla y su color, y los looks se compran completos. Lenta, sobria y sin ruido.',
    nameFont: "font-['Instrument_Serif']",
    accent: '#d9a07a',
    facts: [
      { label: 'Tallas', value: 'XS–XL' },
      { label: 'Colores', value: 'Por pieza' },
      { label: 'Looks', value: 'Completos' },
    ],
    product: {
      title: 'Abrigo de lana',
      meta: 'Tallas XS–XL · 3 colores',
      price: '$ 890.000',
      action: 'Añadir a la bolsa',
      media: 'fashionMain',
    },
    font: 'Instrument Serif',
    radius: '0 px',
    palette: ['#f4f0e8', '#1a1714', '#9a4a2e', '#948062'],
    motion: '900 ms · cubic-bezier(.22, 1, .36, 1)',
    navigation: 'Menú de pantalla completa y barra casi invisible',
    data: 'Prendas con variantes talla × color y looks completos',
    movement: 'Cortina lenta y pesada, sin rebotes',
  },
  food: {
    blurb:
      'Un restaurante a la brasa con menú por horario, extras a la medida y alérgenos a la vista. Pide en minutos, desde la mesa o la puerta.',
    nameFont: "font-['Bricolage_Grotesque'] font-extrabold",
    accent: '#ff8a3d',
    facts: [
      { label: 'Menú', value: 'Por horario' },
      { label: 'Pedido', value: 'Con extras' },
      { label: 'Alérgenos', value: 'Visibles' },
    ],
    product: {
      title: 'Costillas a la brasa',
      meta: 'Listo en 30 min · Para compartir',
      price: '$ 48.000',
      action: 'Pedir ahora',
      media: 'food',
    },
    font: 'Bricolage Grotesque',
    radius: '28 px · 999 px',
    palette: ['#fff6e9', '#2a1510', '#c2311d', '#c48132'],
    motion: '520 ms · cubic-bezier(.34, 1.56, .64, 1)',
    navigation: 'Barra inferior y hojas deslizables para el pedido',
    data: 'Platos con opciones, extras, alérgenos y horario',
    movement: 'Rebote ágil que invita a pedir',
  },
  market: {
    blurb:
      'Un marketplace para comparar, filtrar y encontrar la mejor oferta. Especificaciones, reseñas y precios al instante.',
    nameFont: "font-['Archivo'] font-extrabold",
    accent: '#7aa2ff',
    facts: [
      { label: 'Búsqueda', value: 'Con filtros' },
      { label: 'Compra', value: 'Comparador' },
      { label: 'Precios', value: 'Ofertas' },
    ],
    product: {
      title: 'Audífonos inalámbricos',
      meta: '4,6 ★ · Envío gratis',
      price: '$ 189.900',
      action: 'Agregar al carrito',
      media: 'market',
    },
    font: 'Archivo',
    radius: '8 px · 6 px',
    palette: ['#f5f7fa', '#0e1726', '#1d4ed8', '#8390a6'],
    motion: '250 ms · cubic-bezier(.2, 0, 0, 1)',
    navigation: 'Mega-menú, filtros laterales y comparador',
    data: 'Productos con especificaciones, reseñas y ofertas',
    movement: 'Respuesta inmediata, sin adornos',
  },
}

export const EXPERIENCE_IDS = Object.keys(SHOWCASE) as readonly ExperienceId[]
