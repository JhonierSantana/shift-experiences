// Mock catalog for Maison Vela. Loaded lazily by the repositories (own chunk).
import {
  money,
  type Category,
  type FashionCollection,
  type FashionColor,
  type FashionFit,
  type FashionProduct,
  type FashionVariant,
  type Look,
} from '@/core/domain'
import { placeholderMedia } from '@/infra/mock'

const COLORS = {
  hueso: { id: 'hueso', name: 'Hueso', swatch: '#efe8dc' },
  marfil: { id: 'marfil', name: 'Marfil', swatch: '#f3eee3' },
  crudo: { id: 'crudo', name: 'Crudo', swatch: '#e6dccb' },
  camel: { id: 'camel', name: 'Camel', swatch: '#b98b5e' },
  arcilla: { id: 'arcilla', name: 'Arcilla', swatch: '#b0694a' },
  salvia: { id: 'salvia', name: 'Salvia', swatch: '#9aa58c' },
  oliva: { id: 'oliva', name: 'Oliva', swatch: '#6b6a3f' },
  piedra: { id: 'piedra', name: 'Gris piedra', swatch: '#8d8a84' },
  chocolate: { id: 'chocolate', name: 'Chocolate', swatch: '#4b3327' },
  vino: { id: 'vino', name: 'Vino', swatch: '#5a2330' },
  noche: { id: 'noche', name: 'Azul noche', swatch: '#26304a' },
  tinta: { id: 'tinta', name: 'Tinta', swatch: '#1f1d1b' },
} as const satisfies Record<string, FashionColor>

type ColorId = keyof typeof COLORS

const LETTER_SIZES = ['XS', 'S', 'M', 'L', 'XL'] as const
const WAIST_SIZES = ['36', '38', '40', '42', '44'] as const

export const categories: readonly Category[] = [
  { id: 'abrigos', label: 'Abrigos', description: 'Capas exteriores de lana, alpaca y paño.' },
  { id: 'chaquetas', label: 'Chaquetas y blazers' },
  { id: 'camisas', label: 'Camisas y blusas' },
  { id: 'punto', label: 'Punto' },
  { id: 'pantalones', label: 'Pantalones' },
  { id: 'vestidos', label: 'Vestidos' },
  { id: 'faldas', label: 'Faldas' },
  { id: 'accesorios', label: 'Accesorios' },
]

export const collections: readonly FashionCollection[] = [
  {
    id: 'lino-crudo',
    name: 'Lino crudo',
    season: 'Primavera — Verano 2026',
    statement: 'Fibras que respiran, arrugas que se aceptan. Lino europeo lavado a piedra.',
  },
  {
    id: 'sastreria-blanda',
    name: 'Sastrería blanda',
    season: 'Otoño — Invierno 2026',
    statement: 'Hombros sin hombreras, lana que cae. La estructura del traje sin su rigidez.',
  },
  {
    id: 'noche-de-arcilla',
    name: 'Noche de arcilla',
    season: 'Cápsula 2026',
    statement: 'Seda, satén y tonos de tierra cocida para cuando cae la luz.',
  },
]

interface Draft {
  readonly id: string
  readonly title: string
  readonly description: string
  /** Pesos. */
  readonly price: number
  readonly categoryId: string
  readonly collectionId: string
  readonly fit: FashionFit
  readonly sizes: readonly string[]
  readonly colors: readonly ColorId[]
  readonly composition: string
  readonly care: readonly string[]
  readonly tags: readonly string[]
  readonly createdAt: string
  /** Pesos, per color (e.g. naturally dyed yarn costs more). */
  readonly colorPrice?: Partial<Record<ColorId, number>>
}

const WOOL_CARE = ['Lavado en seco profesional', 'No usar secadora', 'Planchar al vapor, del revés']
const LINEN_CARE = [
  'Lavar a máquina en frío, ciclo delicado',
  'Secar a la sombra',
  'Planchar húmedo',
]
const SILK_CARE = ['Lavar a mano en agua fría', 'No retorcer', 'Planchar a baja temperatura']
const LEATHER_CARE = [
  'Limpiar con paño seco',
  'Hidratar con crema neutra cada seis meses',
  'Guardar en su bolsa de algodón',
]

const drafts: readonly Draft[] = [
  {
    id: 'fv-abrigo-lana-cruda',
    title: 'Abrigo largo de lana cruda',
    description:
      'Abrigo recto hasta la pantorrilla, sin forro, en lana virgen sin teñir. Solapa amplia y bolsillos de parche que desaparecen en la costura.',
    price: 1_290_000,
    categoryId: 'abrigos',
    collectionId: 'sastreria-blanda',
    fit: 'relaxed',
    sizes: LETTER_SIZES.slice(0, 4),
    colors: ['camel', 'piedra'],
    composition: '90 % lana virgen, 10 % cachemira',
    care: WOOL_CARE,
    tags: ['nuevo', 'esencial'],
    createdAt: '2026-08-28',
  },
  {
    id: 'fv-abrigo-cruzado',
    title: 'Abrigo cruzado de paño',
    description:
      'Paño compacto de doble faz con cierre cruzado de seis botones de corozo. Una pieza para durar más de una década.',
    price: 1_150_000,
    categoryId: 'abrigos',
    collectionId: 'sastreria-blanda',
    fit: 'regular',
    sizes: LETTER_SIZES,
    colors: ['noche', 'tinta'],
    composition: '80 % lana, 20 % poliamida reciclada',
    care: WOOL_CARE,
    tags: ['esencial'],
    createdAt: '2026-08-02',
  },
  {
    id: 'fv-capa-alpaca',
    title: 'Capa de alpaca cepillada',
    description:
      'Capa envolvente tejida en telar manual en Cusco. El cepillado a mano le da un halo suave que atrapa la luz.',
    price: 980_000,
    categoryId: 'abrigos',
    collectionId: 'sastreria-blanda',
    fit: 'oversized',
    sizes: ['S/M', 'L/XL'],
    colors: ['crudo', 'chocolate'],
    colorPrice: { chocolate: 1_040_000 },
    composition: '70 % alpaca baby, 30 % lana merino',
    care: WOOL_CARE,
    tags: ['artesanal'],
    createdAt: '2026-07-15',
  },
  {
    id: 'fv-blazer-lino',
    title: 'Blazer desestructurado de lino',
    description:
      'Sin entretela ni hombreras: el blazer que se lleva como una camisa. Botones de nácar y costuras francesas.',
    price: 690_000,
    categoryId: 'chaquetas',
    collectionId: 'lino-crudo',
    fit: 'relaxed',
    sizes: LETTER_SIZES,
    colors: ['hueso', 'salvia'],
    composition: '100 % lino',
    care: LINEN_CARE,
    tags: ['esencial'],
    createdAt: '2026-03-10',
  },
  {
    id: 'fv-chaqueta-obrera',
    title: 'Chaqueta obrera de algodón encerado',
    description:
      'Inspirada en la ropa de taller: cuatro bolsillos, cuello de pana y un encerado que mejora con el uso.',
    price: 540_000,
    categoryId: 'chaquetas',
    collectionId: 'sastreria-blanda',
    fit: 'regular',
    sizes: LETTER_SIZES,
    colors: ['oliva', 'tinta'],
    composition: '100 % algodón orgánico encerado',
    care: ['No lavar a máquina', 'Limpiar con paño húmedo', 'Re-encerar una vez al año'],
    tags: [],
    createdAt: '2026-06-21',
  },
  {
    id: 'fv-blazer-lana-fria',
    title: 'Blazer de lana fría',
    description:
      'Lana fría de 230 gramos que funciona en cualquier estación. Corte entallado, una sola abotonadura.',
    price: 760_000,
    categoryId: 'chaquetas',
    collectionId: 'sastreria-blanda',
    fit: 'slim',
    sizes: LETTER_SIZES,
    colors: ['piedra', 'tinta'],
    composition: '100 % lana fría super 110',
    care: WOOL_CARE,
    tags: ['nuevo'],
    createdAt: '2026-09-04',
  },
  {
    id: 'fv-camisa-lino',
    title: 'Camisa de lino lavado',
    description:
      'Lino de peso medio lavado a piedra para una caída suave desde el primer día. Cuello camisero y bajo redondeado.',
    price: 290_000,
    categoryId: 'camisas',
    collectionId: 'lino-crudo',
    fit: 'relaxed',
    sizes: LETTER_SIZES,
    colors: ['marfil', 'salvia', 'arcilla'],
    composition: '100 % lino',
    care: LINEN_CARE,
    tags: ['esencial', 'más vendido'],
    createdAt: '2026-02-18',
  },
  {
    id: 'fv-camisa-mao',
    title: 'Camisa de popelina con cuello mao',
    description:
      'Popelina de algodón egipcio, cuello mao y tapeta oculta. Limpia, casi arquitectónica.',
    price: 260_000,
    categoryId: 'camisas',
    collectionId: 'sastreria-blanda',
    fit: 'regular',
    sizes: LETTER_SIZES,
    colors: ['marfil', 'noche'],
    composition: '100 % algodón egipcio',
    care: ['Lavar a máquina a 30 °C', 'Planchar a temperatura media'],
    tags: [],
    createdAt: '2026-05-30',
  },
  {
    id: 'fv-blusa-seda',
    title: 'Blusa de seda lavada',
    description:
      'Seda de morera lavada con arena, de tacto mate. Escote en pico y puños con presilla.',
    price: 420_000,
    categoryId: 'camisas',
    collectionId: 'noche-de-arcilla',
    fit: 'relaxed',
    sizes: LETTER_SIZES.slice(0, 4),
    colors: ['arcilla', 'vino'],
    composition: '100 % seda de morera',
    care: SILK_CARE,
    tags: ['nuevo'],
    createdAt: '2026-09-12',
  },
  {
    id: 'fv-sueter-cachemira',
    title: 'Suéter de cachemira de cuello redondo',
    description:
      'Cachemira mongola de dos cabos, tejida en galga 12. Ligero, cálido y pensado para llevar sobre la piel.',
    price: 620_000,
    categoryId: 'punto',
    collectionId: 'sastreria-blanda',
    fit: 'regular',
    sizes: LETTER_SIZES,
    colors: ['camel', 'crudo', 'piedra'],
    composition: '100 % cachemira',
    care: ['Lavar a mano en agua fría', 'Secar en plano', 'Guardar doblado, nunca colgado'],
    tags: ['esencial', 'más vendido'],
    createdAt: '2026-08-15',
  },
  {
    id: 'fv-cardigan-mohair',
    title: 'Cárdigan de mohair',
    description:
      'Punto abierto y esponjoso con botones forrados. Amplio, para llevar sobre camisa o vestido.',
    price: 480_000,
    categoryId: 'punto',
    collectionId: 'sastreria-blanda',
    fit: 'oversized',
    sizes: ['S', 'M', 'L'],
    colors: ['crudo', 'salvia'],
    composition: '72 % mohair, 28 % seda',
    care: ['Lavar a mano en agua fría', 'Secar en plano'],
    tags: [],
    createdAt: '2026-07-28',
  },
  {
    id: 'fv-polo-calado',
    title: 'Polo de punto calado',
    description: 'Algodón mercerizado con calado geométrico. El punto de verano que no se deforma.',
    price: 310_000,
    categoryId: 'punto',
    collectionId: 'lino-crudo',
    fit: 'regular',
    sizes: LETTER_SIZES,
    colors: ['hueso', 'tinta'],
    composition: '100 % algodón mercerizado',
    care: ['Lavar a mano', 'Secar en plano a la sombra'],
    tags: [],
    createdAt: '2026-04-02',
  },
  {
    id: 'fv-pantalon-pinzas',
    title: 'Pantalón de pinzas en lana',
    description:
      'Doble pinza, tiro alto y bajo con vuelta. Pierna amplia que cae recta hasta el zapato.',
    price: 450_000,
    categoryId: 'pantalones',
    collectionId: 'sastreria-blanda',
    fit: 'relaxed',
    sizes: WAIST_SIZES,
    colors: ['piedra', 'tinta', 'chocolate'],
    composition: '98 % lana, 2 % elastano',
    care: WOOL_CARE,
    tags: ['esencial'],
    createdAt: '2026-08-20',
  },
  {
    id: 'fv-pantalon-lino',
    title: 'Pantalón recto de lino',
    description:
      'Cintura con cordón interior y bolsillos al bies. El pantalón de todos los días de julio.',
    price: 340_000,
    categoryId: 'pantalones',
    collectionId: 'lino-crudo',
    fit: 'relaxed',
    sizes: WAIST_SIZES,
    colors: ['hueso', 'arcilla'],
    composition: '100 % lino',
    care: LINEN_CARE,
    tags: [],
    createdAt: '2026-03-22',
  },
  {
    id: 'fv-vaquero-recto',
    title: 'Vaquero de corte recto',
    description: 'Denim japonés de orillo de 13 onzas, sin lavar. Se adapta a quien lo usa.',
    price: 360_000,
    categoryId: 'pantalones',
    collectionId: 'sastreria-blanda',
    fit: 'regular',
    sizes: WAIST_SIZES,
    colors: ['noche', 'crudo'],
    composition: '100 % algodón, denim de orillo',
    care: ['Lavar lo menos posible, del revés y en frío', 'Secar colgado'],
    tags: [],
    createdAt: '2026-01-14',
  },
  {
    id: 'fv-vestido-camisero',
    title: 'Vestido camisero de lino',
    description:
      'Largo midi, cinturón del mismo tejido y mangas para remangar. Fresco sin ser informal.',
    price: 520_000,
    categoryId: 'vestidos',
    collectionId: 'lino-crudo',
    fit: 'relaxed',
    sizes: LETTER_SIZES.slice(0, 4),
    colors: ['salvia', 'marfil'],
    composition: '100 % lino',
    care: LINEN_CARE,
    tags: ['más vendido'],
    createdAt: '2026-03-01',
  },
  {
    id: 'fv-vestido-lencero',
    title: 'Vestido lencero de satén',
    description:
      'Cortado al bies para que siga el cuerpo sin marcarlo. Tirantes ajustables y espalda baja.',
    price: 580_000,
    categoryId: 'vestidos',
    collectionId: 'noche-de-arcilla',
    fit: 'slim',
    sizes: LETTER_SIZES.slice(0, 4),
    colors: ['arcilla', 'tinta'],
    composition: '100 % satén de seda',
    care: SILK_CARE,
    tags: ['nuevo'],
    createdAt: '2026-09-10',
  },
  {
    id: 'fv-vestido-acanalado',
    title: 'Vestido de punto acanalado',
    description:
      'Canalé de lana merino hasta el tobillo, cuello alto y abertura lateral para caminar.',
    price: 490_000,
    categoryId: 'vestidos',
    collectionId: 'sastreria-blanda',
    fit: 'slim',
    sizes: LETTER_SIZES.slice(0, 4),
    colors: ['chocolate', 'piedra'],
    composition: '100 % lana merino extrafina',
    care: ['Lavar a mano en agua fría', 'Secar en plano'],
    tags: [],
    createdAt: '2026-08-08',
  },
  {
    id: 'fv-falda-plisada',
    title: 'Falda midi plisada',
    description: 'Plisado permanente en crepé fluido; se mueve con cada paso y vuelve a su forma.',
    price: 380_000,
    categoryId: 'faldas',
    collectionId: 'noche-de-arcilla',
    fit: 'regular',
    sizes: LETTER_SIZES.slice(0, 4),
    colors: ['vino', 'tinta'],
    composition: '100 % poliéster reciclado',
    care: ['Lavar a mano en frío', 'No planchar sobre los pliegues'],
    tags: [],
    createdAt: '2026-09-01',
  },
  {
    id: 'fv-falda-lapiz',
    title: 'Falda lápiz de lana',
    description: 'Tiro alto, largo a la rodilla y abertura trasera. Forro de cupro que no se pega.',
    price: 350_000,
    categoryId: 'faldas',
    collectionId: 'sastreria-blanda',
    fit: 'slim',
    sizes: WAIST_SIZES.slice(0, 4),
    colors: ['piedra'],
    composition: '96 % lana, 4 % elastano; forro de cupro',
    care: WOOL_CARE,
    tags: [],
    createdAt: '2026-07-05',
  },
  {
    id: 'fv-tote-cuero',
    title: 'Bolso tote de cuero vegetal',
    description:
      'Cuero curtido con taninos vegetales en Bogotá. Sin herrajes, costura a mano y bolsillo interior.',
    price: 690_000,
    categoryId: 'accesorios',
    collectionId: 'lino-crudo',
    fit: 'regular',
    sizes: ['Única'],
    colors: ['chocolate', 'camel'],
    composition: '100 % cuero bovino de curtido vegetal',
    care: LEATHER_CARE,
    tags: ['artesanal', 'más vendido'],
    createdAt: '2026-04-18',
  },
  {
    id: 'fv-bufanda-merino',
    title: 'Bufanda de lana merino',
    description: 'Tejido en espiga, flecos cortos y un largo generoso para dar dos vueltas.',
    price: 210_000,
    categoryId: 'accesorios',
    collectionId: 'sastreria-blanda',
    fit: 'regular',
    sizes: ['Única'],
    colors: ['camel', 'piedra', 'vino'],
    composition: '100 % lana merino',
    care: ['Lavar a mano en agua fría', 'Secar en plano'],
    tags: [],
    createdAt: '2026-08-25',
  },
  {
    id: 'fv-cinturon-cuero',
    title: 'Cinturón de cuero liso',
    description:
      'Tres centímetros de ancho, hebilla de latón cepillado. Talla por centímetros de cintura.',
    price: 180_000,
    categoryId: 'accesorios',
    collectionId: 'sastreria-blanda',
    fit: 'regular',
    sizes: ['85', '90', '95', '100'],
    colors: ['tinta', 'chocolate'],
    composition: 'Cuero bovino; hebilla de latón',
    care: LEATHER_CARE,
    tags: [],
    createdAt: '2026-06-10',
  },
  {
    id: 'fv-mocasin',
    title: 'Mocasín de piel de becerro',
    description:
      'Construcción Blake, suela de cuero y plantilla acolchada. Se amolda al pie en dos semanas.',
    price: 640_000,
    categoryId: 'accesorios',
    collectionId: 'noche-de-arcilla',
    fit: 'regular',
    sizes: ['36', '37', '38', '39', '40', '41'],
    colors: ['tinta', 'chocolate'],
    composition: 'Piel de becerro; suela de cuero',
    care: LEATHER_CARE,
    tags: ['nuevo'],
    createdAt: '2026-09-15',
  },
]

const lookDrafts: readonly Omit<Look, 'media'>[] = [
  {
    id: 'look-01',
    title: 'Oficio silencioso',
    collectionId: 'sastreria-blanda',
    productIds: ['fv-abrigo-lana-cruda', 'fv-sueter-cachemira', 'fv-pantalon-pinzas', 'fv-mocasin'],
  },
  {
    id: 'look-02',
    title: 'Mediodía en lino',
    collectionId: 'lino-crudo',
    productIds: ['fv-camisa-lino', 'fv-pantalon-lino', 'fv-tote-cuero'],
  },
  {
    id: 'look-03',
    title: 'Cuando cae la luz',
    collectionId: 'noche-de-arcilla',
    productIds: ['fv-blusa-seda', 'fv-falda-plisada', 'fv-mocasin'],
  },
  {
    id: 'look-04',
    title: 'Sastrería sin rigidez',
    collectionId: 'sastreria-blanda',
    productIds: ['fv-blazer-lana-fria', 'fv-camisa-mao', 'fv-falda-lapiz', 'fv-cinturon-cuero'],
  },
  {
    id: 'look-05',
    title: 'Sábado de huerta',
    collectionId: 'lino-crudo',
    productIds: ['fv-vestido-camisero', 'fv-cardigan-mohair', 'fv-tote-cuero'],
  },
  {
    id: 'look-06',
    title: 'Viaje al páramo',
    collectionId: 'sastreria-blanda',
    productIds: ['fv-capa-alpaca', 'fv-vestido-acanalado', 'fv-bufanda-merino'],
  },
]

/** Deterministic stock so tests and screenshots are stable; some combinations sell out. */
function stockFor(id: string, sizeIndex: number, colorIndex: number): number {
  return ((sizeIndex + 1) * (colorIndex + 2) + id.length) % 9
}

function buildVariants(draft: Draft): FashionVariant[] {
  return draft.colors.flatMap((colorId, colorIndex) =>
    draft.sizes.map((size, sizeIndex) => {
      const override = draft.colorPrice?.[colorId]
      const variant: FashionVariant = {
        sku: `${draft.id}-${colorId}-${size}`.toUpperCase().replace(/[^A-Z0-9]+/g, '-'),
        size,
        colorId,
        stock: stockFor(draft.id, sizeIndex, colorIndex),
      }
      return override === undefined ? variant : { ...variant, price: money(override, 'COP') }
    }),
  )
}

export const looks: readonly Look[] = lookDrafts.map((look, index) => ({
  ...look,
  media: placeholderMedia(
    `Look ${String(index + 1).padStart(2, '0')}, "${look.title}": prendas de la colección combinadas en estudio`,
    ['#d8c6b0', index % 2 === 0 ? '#8a6f58' : '#3a2c23'],
    { width: 1600, height: 2000, angle: 175 },
  ),
}))

export const products: readonly FashionProduct[] = drafts.map((draft) => {
  const colors = draft.colors.map((id) => COLORS[id])
  const [first] = colors
  const primary = first ?? COLORS.hueso
  return {
    kind: 'fashion',
    id: draft.id,
    slug: draft.id.replace(/^fv-/, ''),
    title: draft.title,
    description: draft.description,
    price: money(draft.price, 'COP'),
    media: [
      placeholderMedia(`${draft.title} en color ${primary.name.toLowerCase()}, vista frontal`, [
        '#f4f0e8',
        primary.swatch,
      ]),
      placeholderMedia(
        `Detalle del tejido: ${draft.composition.toLowerCase()}`,
        [primary.swatch, '#1f1a16'],
        {
          angle: 200,
        },
      ),
    ],
    categoryId: draft.categoryId,
    tags: draft.tags,
    createdAt: draft.createdAt,
    collectionId: draft.collectionId,
    sizes: draft.sizes,
    colors,
    variants: buildVariants(draft),
    fit: draft.fit,
    composition: draft.composition,
    care: draft.care,
    lookIds: looks.filter((look) => look.productIds.includes(draft.id)).map((look) => look.id),
  }
})
