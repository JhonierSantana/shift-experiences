import type { ExperienceId } from '@/engine'
import type { showcaseMedia } from '@/infra/mock'

/**
 * Selector-owned copy of what each brand looks like, used by the hero, the doors and the demo.
 * The palette, display font and motion values mirror each experience's `tokens.css` (the real
 * source of truth): `src/test/showcase-tokens.test.ts` fails if they drift apart.
 */
export interface BrandShowcase {
  /** One short word for the rotating lead ("Una app que se convierte en …"). */
  readonly word: string
  /** Tailwind classes that set the word in the brand's display face. */
  readonly wordFont: string
  /** Light variant of the brand accent, readable on the selector's dark stage. */
  readonly accent: string
  /** One line shown when a door is hovered or focused. */
  readonly highlight: string
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
    word: 'moda',
    wordFont: "font-['Instrument_Serif'] italic",
    accent: '#d9a07a',
    highlight: 'Tallas y colores, looks completos',
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
    word: 'comida',
    wordFont: "font-['Bricolage_Grotesque'] font-extrabold",
    accent: '#ff8a3d',
    highlight: 'Menú por momento del día, pedido en minutos',
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
    word: 'mercado',
    wordFont: "font-['Archivo'] font-extrabold",
    accent: '#7aa2ff',
    highlight: 'Filtros, comparador y ofertas',
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
