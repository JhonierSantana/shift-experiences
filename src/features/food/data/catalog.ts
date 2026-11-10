// Mock menu for Brasa & Co. Loaded lazily by the repositories (own chunk).
import {
  money,
  type Allergen,
  type Category,
  type FoodItem,
  type FoodOption,
  type FoodOptionGroup,
  type Nutrition,
} from '@/core/domain'
import { placeholderMedia } from '@/infra/mock'

export const categories: readonly Category[] = [
  { id: 'parrilla', label: 'Parrilla', description: 'Carnes y pescados sobre carbón de guayabo.' },
  {
    id: 'bowls',
    label: 'Bowls',
    description: 'Granos, vegetales asados y proteína, en un solo plato.',
  },
  { id: 'sanduches', label: 'Sánduches y hamburguesas' },
  { id: 'acompanantes', label: 'Acompañantes' },
  { id: 'postres', label: 'Postres' },
  { id: 'bebidas', label: 'Bebidas' },
]

const option = (
  id: string,
  label: string,
  delta = 0,
  allergens?: readonly Allergen[],
): FoodOption =>
  allergens
    ? { id, label, priceDelta: money(delta, 'COP'), allergens }
    : { id, label, priceDelta: money(delta, 'COP') }

const TERMINO: FoodOptionGroup = {
  id: 'termino',
  label: 'Término de la carne',
  min: 1,
  max: 1,
  options: [
    option('medio', 'Jugoso (término medio)'),
    option('tres-cuartos', 'Tres cuartos'),
    option('bien-asado', 'Bien asado'),
  ],
}

const SALSAS: FoodOptionGroup = {
  id: 'salsas',
  label: 'Salsas de la casa',
  min: 0,
  max: 2,
  options: [
    option('chimichurri', 'Chimichurri de la casa'),
    option('aji-maracuya', 'Ají de maracuyá'),
    option('suero', 'Suero costeño', 0, ['dairy']),
    option('bbq-panela', 'BBQ de panela', 0, ['mustard']),
  ],
}

const ACOMPANANTE: FoodOptionGroup = {
  id: 'acompanante',
  label: 'Acompañante',
  min: 1,
  max: 1,
  options: [
    option('papas', 'Papas rústicas'),
    option('yuca', 'Yuca frita'),
    option('ensalada', 'Ensalada de la huerta', 0, ['mustard']),
    option('arroz-coco', 'Arroz con coco', 3_000),
  ],
}

const EXTRAS: FoodOptionGroup = {
  id: 'extras',
  label: 'Extras',
  min: 0,
  max: 3,
  options: [
    option('queso', 'Queso costeño', 4_000, ['dairy']),
    option('tocineta', 'Tocineta ahumada', 5_500),
    option('aguacate', 'Aguacate', 4_500),
    option('huevo', 'Huevo frito', 3_000, ['egg']),
  ],
}

const PAN: FoodOptionGroup = {
  id: 'pan',
  label: 'Pan',
  min: 1,
  max: 1,
  options: [
    option('brioche', 'Brioche', 0, ['gluten', 'egg', 'dairy']),
    option('masa-madre', 'Masa madre', 0, ['gluten']),
    option('lechuga', 'Sin pan (envuelto en lechuga)'),
  ],
}

const BASE_BOWL: FoodOptionGroup = {
  id: 'base',
  label: 'Base',
  min: 1,
  max: 1,
  options: [
    option('quinoa', 'Quinoa tricolor'),
    option('arroz-integral', 'Arroz integral'),
    option('hojas', 'Mix de hojas'),
  ],
}

const PROTEINA_EXTRA: FoodOptionGroup = {
  id: 'proteina-extra',
  label: 'Proteína adicional',
  min: 0,
  max: 1,
  options: [
    option('pollo', 'Pollo al carbón', 7_000),
    option('res', 'Res ahumada', 9_000),
    option('tofu', 'Tofu a la brasa', 6_000, ['soy']),
  ],
}

const TAMANO_BEBIDA: FoodOptionGroup = {
  id: 'tamano',
  label: 'Tamaño',
  min: 1,
  max: 1,
  options: [option('vaso', 'Vaso de 350 ml'), option('jarra', 'Jarra de 1 litro', 9_000)],
}

interface Draft {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly price: number
  readonly categoryId: string
  readonly ingredients: readonly string[]
  readonly allergens: readonly Allergen[]
  /** [grams, kcal, protein, carbs, fat] */
  readonly nutrition: readonly [number, number, number, number, number]
  readonly optionGroups?: readonly FoodOptionGroup[]
  readonly prepTimeMinutes: number
  readonly spiceLevel?: 0 | 1 | 2 | 3
  readonly tags?: readonly string[]
  readonly available?: boolean
  readonly createdAt: string
  readonly tones: readonly [string, string]
}

const drafts: readonly Draft[] = [
  // ------------------------------------------------ parrilla
  {
    id: 'bc-costilla',
    title: 'Costilla de cerdo a la brasa',
    description:
      'Seis horas de cocción lenta y un final sobre carbón, glaseada con panela y ají dulce.',
    price: 48_900,
    categoryId: 'parrilla',
    ingredients: ['Costilla de cerdo', 'Panela', 'Ají dulce', 'Ajo', 'Comino', 'Mostaza'],
    allergens: ['mustard'],
    nutrition: [420, 890, 52, 34, 58],
    optionGroups: [ACOMPANANTE, SALSAS],
    prepTimeMinutes: 25,
    spiceLevel: 1,
    tags: ['más pedido'],
    createdAt: '2026-01-10',
    tones: ['#7a2e14', '#e0a060'],
  },
  {
    id: 'bc-pollo-carbon',
    title: 'Medio pollo al carbón',
    description: 'Marinado 24 horas en naranja agria, ajo y achiote. Piel crocante, carne jugosa.',
    price: 36_900,
    categoryId: 'parrilla',
    ingredients: ['Pollo campesino', 'Naranja agria', 'Achiote', 'Ajo', 'Orégano'],
    allergens: ['celery'],
    nutrition: [450, 720, 68, 6, 46],
    optionGroups: [ACOMPANANTE, SALSAS],
    prepTimeMinutes: 20,
    tags: ['sin gluten'],
    createdAt: '2026-01-10',
    tones: ['#9c4a1a', '#f0c27a'],
  },
  {
    id: 'bc-punta-anca',
    title: 'Punta de anca a la parrilla',
    description:
      '350 gramos de res madurada 21 días, sellada con sal gruesa y terminada en brasa de guayabo.',
    price: 56_900,
    categoryId: 'parrilla',
    ingredients: ['Punta de anca madurada', 'Sal marina gruesa', 'Pimienta negra'],
    allergens: [],
    nutrition: [350, 760, 70, 0, 52],
    optionGroups: [TERMINO, ACOMPANANTE, SALSAS],
    prepTimeMinutes: 22,
    tags: ['sin gluten', 'recomendado'],
    createdAt: '2026-02-01',
    tones: ['#5a1e10', '#c8643c'],
  },
  {
    id: 'bc-chorizo-arepa',
    title: 'Chorizo santarrosano con arepa',
    description: 'Dos chorizos artesanales de Santa Rosa de Cabal con arepa de maíz peto y limón.',
    price: 22_900,
    categoryId: 'parrilla',
    ingredients: ['Chorizo de cerdo', 'Arepa de maíz peto', 'Queso campesino', 'Limón'],
    allergens: ['dairy', 'sulphites'],
    nutrition: [280, 610, 28, 36, 40],
    optionGroups: [SALSAS],
    prepTimeMinutes: 12,
    spiceLevel: 1,
    createdAt: '2026-01-10',
    tones: ['#8a3218', '#e8b070'],
  },
  {
    id: 'bc-pesca-dia',
    title: 'Pesca del día a la brasa',
    description:
      'Pescado entero de la costa pacífica, envuelto en hoja de plátano con leche de coco y limón.',
    price: 52_900,
    categoryId: 'parrilla',
    ingredients: ['Pargo rojo', 'Hoja de plátano', 'Leche de coco', 'Limón', 'Cilantro cimarrón'],
    allergens: ['fish', 'celery'],
    nutrition: [400, 540, 62, 8, 28],
    optionGroups: [ACOMPANANTE],
    prepTimeMinutes: 30,
    tags: ['sin gluten'],
    available: false,
    createdAt: '2026-05-12',
    tones: ['#2f5d50', '#e8d6a8'],
  },
  {
    id: 'bc-tabla-dos',
    title: 'Tabla Brasa para dos',
    description:
      'Punta de anca, medio pollo, chorizo y costilla con dos acompañantes y tres salsas.',
    price: 118_000,
    categoryId: 'parrilla',
    ingredients: [
      'Punta de anca',
      'Pollo',
      'Chorizo',
      'Costilla de cerdo',
      'Papas rústicas',
      'Yuca frita',
    ],
    allergens: ['mustard', 'dairy', 'sulphites'],
    nutrition: [1300, 2980, 210, 120, 180],
    optionGroups: [TERMINO, { ...SALSAS, max: 3, label: 'Salsas (elige hasta 3)' }],
    prepTimeMinutes: 35,
    spiceLevel: 1,
    tags: ['para compartir'],
    createdAt: '2026-03-20',
    tones: ['#4a1a0c', '#d88040'],
  },
  // ------------------------------------------------ bowls
  {
    id: 'bc-bowl-quinoa',
    title: 'Bowl de quinoa y maíz asado',
    description:
      'Quinoa tricolor, maíz y ahuyama asados, frijol cabecita negra, aguacate y vinagreta de ajonjolí.',
    price: 32_900,
    categoryId: 'bowls',
    ingredients: [
      'Quinoa',
      'Maíz asado',
      'Ahuyama',
      'Frijol cabecita negra',
      'Aguacate',
      'Ajonjolí',
    ],
    allergens: ['sesame'],
    nutrition: [420, 560, 18, 72, 22],
    optionGroups: [PROTEINA_EXTRA],
    prepTimeMinutes: 10,
    tags: ['vegano', 'sin gluten'],
    createdAt: '2026-04-05',
    tones: ['#c89a3a', '#6b8a3a'],
  },
  {
    id: 'bc-bowl-res',
    title: 'Bowl de res ahumada',
    description:
      'Res desmechada ahumada en roble, encurtidos de la casa, arroz y salsa de soya con panela.',
    price: 38_900,
    categoryId: 'bowls',
    ingredients: [
      'Res ahumada',
      'Cebolla encurtida',
      'Rábano',
      'Cilantro',
      'Salsa de soya',
      'Ajonjolí',
    ],
    allergens: ['soy', 'sesame', 'gluten'],
    nutrition: [460, 680, 42, 64, 24],
    optionGroups: [BASE_BOWL, SALSAS],
    prepTimeMinutes: 12,
    spiceLevel: 1,
    createdAt: '2026-04-05',
    tones: ['#5a2a14', '#b87a3a'],
  },
  {
    id: 'bc-bowl-salmon',
    title: 'Bowl de salmón y mango',
    description:
      'Salmón sellado a la brasa, mango biche, pepino, edamame y mayonesa de ají amarillo.',
    price: 42_900,
    categoryId: 'bowls',
    ingredients: ['Salmón', 'Mango biche', 'Pepino', 'Edamame', 'Ají amarillo', 'Huevo'],
    allergens: ['fish', 'soy', 'egg'],
    nutrition: [430, 610, 36, 52, 26],
    optionGroups: [BASE_BOWL],
    prepTimeMinutes: 12,
    spiceLevel: 2,
    tags: ['nuevo'],
    createdAt: '2026-08-30',
    tones: ['#e07a4a', '#f2c94c'],
  },
  {
    id: 'bc-bowl-falafel',
    title: 'Bowl verde de falafel',
    description:
      'Falafel de garbanzo y cilantro, hummus de ahuyama, tabulé de quinoa y hojas frescas.',
    price: 31_900,
    categoryId: 'bowls',
    ingredients: ['Garbanzo', 'Cilantro', 'Ahuyama', 'Tahini', 'Quinoa', 'Hierbabuena'],
    allergens: ['sesame', 'gluten'],
    nutrition: [410, 590, 20, 70, 24],
    prepTimeMinutes: 10,
    tags: ['vegano'],
    createdAt: '2026-06-18',
    tones: ['#4f7a3a', '#d8c070'],
  },
  // ------------------------------------------------ sánduches
  {
    id: 'bc-sanduche-cerdo',
    title: 'Sánduche de cerdo desmechado',
    description: 'Bondiola cocinada doce horas, repollo morado encurtido y mayonesa de chipotle.',
    price: 29_900,
    categoryId: 'sanduches',
    ingredients: ['Bondiola de cerdo', 'Repollo morado', 'Chipotle', 'Mayonesa', 'Cilantro'],
    allergens: ['egg'],
    nutrition: [320, 720, 38, 58, 36],
    optionGroups: [PAN, EXTRAS],
    prepTimeMinutes: 12,
    spiceLevel: 2,
    tags: ['más pedido'],
    createdAt: '2026-02-14',
    tones: ['#8a4a22', '#e6b87a'],
  },
  {
    id: 'bc-hamburguesa-brasa',
    title: 'Hamburguesa Brasa',
    description:
      '180 gramos de mezcla de res madurada, queso cheddar añejo, cebolla caramelizada y salsa de la casa.',
    price: 34_900,
    categoryId: 'sanduches',
    ingredients: ['Carne de res', 'Queso cheddar', 'Cebolla caramelizada', 'Pepinillos', 'Mostaza'],
    allergens: ['dairy', 'mustard'],
    nutrition: [360, 890, 46, 52, 54],
    optionGroups: [TERMINO, PAN, EXTRAS],
    prepTimeMinutes: 15,
    tags: ['más pedido', 'recomendado'],
    createdAt: '2026-01-10',
    tones: ['#6a2a10', '#f0b050'],
  },
  {
    id: 'bc-hamburguesa-lentejas',
    title: 'Hamburguesa de lentejas y remolacha',
    description:
      'Medallón de lentejas, remolacha y avena, con queso fundido, tomate asado y alioli de ajo negro.',
    price: 30_900,
    categoryId: 'sanduches',
    ingredients: ['Lentejas', 'Remolacha', 'Avena', 'Queso', 'Tomate', 'Ajo negro'],
    allergens: ['dairy', 'egg', 'gluten'],
    nutrition: [340, 640, 26, 70, 26],
    optionGroups: [PAN, EXTRAS],
    prepTimeMinutes: 14,
    tags: ['vegetariano'],
    createdAt: '2026-07-01',
    tones: ['#7a2a3a', '#d8a060'],
  },
  {
    id: 'bc-sanduche-pollo',
    title: 'Sánduche de pollo al carbón',
    description: 'Pollo desmechado del asador, aguacate, tomate y mayonesa de mostaza antigua.',
    price: 27_900,
    categoryId: 'sanduches',
    ingredients: ['Pollo al carbón', 'Aguacate', 'Tomate', 'Mayonesa', 'Mostaza antigua'],
    allergens: ['egg', 'mustard'],
    nutrition: [310, 620, 40, 50, 28],
    optionGroups: [PAN, EXTRAS],
    prepTimeMinutes: 10,
    createdAt: '2026-02-14',
    tones: ['#a05a24', '#f2d08a'],
  },
  // ------------------------------------------------ acompañantes
  {
    id: 'bc-papas-rusticas',
    title: 'Papas rústicas con romero',
    description: 'Papa criolla y pastusa en gajos, fritas dos veces, con sal de romero.',
    price: 12_900,
    categoryId: 'acompanantes',
    ingredients: ['Papa pastusa', 'Papa criolla', 'Romero', 'Sal marina'],
    allergens: [],
    nutrition: [220, 380, 5, 48, 18],
    optionGroups: [SALSAS],
    prepTimeMinutes: 8,
    tags: ['vegano', 'sin gluten'],
    createdAt: '2026-01-10',
    tones: ['#c8902a', '#f6d88a'],
  },
  {
    id: 'bc-elote',
    title: 'Elote asado con suero costeño',
    description: 'Mazorca a la brasa con suero costeño, queso rallado, limón y chile en polvo.',
    price: 11_900,
    categoryId: 'acompanantes',
    ingredients: ['Mazorca', 'Suero costeño', 'Queso costeño', 'Limón', 'Chile'],
    allergens: ['dairy'],
    nutrition: [200, 290, 9, 34, 14],
    prepTimeMinutes: 8,
    spiceLevel: 1,
    tags: ['vegetariano', 'sin gluten'],
    createdAt: '2026-03-02',
    tones: ['#e0b030', '#f4e2a0'],
  },
  {
    id: 'bc-yuca-frita',
    title: 'Yuca frita con ají picante',
    description: 'Bastones de yuca cocida y frita, crocantes por fuera, con ají de la casa.',
    price: 10_900,
    categoryId: 'acompanantes',
    ingredients: ['Yuca', 'Ají', 'Cilantro', 'Cebolla larga'],
    allergens: [],
    nutrition: [220, 340, 3, 56, 12],
    prepTimeMinutes: 8,
    spiceLevel: 2,
    tags: ['vegano', 'sin gluten'],
    createdAt: '2026-01-10',
    tones: ['#e8c878', '#9a6a24'],
  },
  {
    id: 'bc-ensalada-huerta',
    title: 'Ensalada de la huerta',
    description:
      'Hojas de la sabana, tomate cherry, rábano, pepino y vinagreta de mostaza y miel de caña.',
    price: 14_900,
    categoryId: 'acompanantes',
    ingredients: ['Lechugas', 'Tomate cherry', 'Rábano', 'Pepino', 'Mostaza', 'Miel de caña'],
    allergens: ['mustard'],
    nutrition: [180, 140, 3, 14, 8],
    prepTimeMinutes: 6,
    tags: ['vegano', 'sin gluten'],
    createdAt: '2026-01-10',
    tones: ['#5a8a3a', '#c8e0a0'],
  },
  {
    id: 'bc-aros-cebolla',
    title: 'Aros de cebolla en cerveza',
    description: 'Cebolla blanca en tempura de cerveza roja, con mayonesa de ajo asado.',
    price: 13_900,
    categoryId: 'acompanantes',
    ingredients: ['Cebolla blanca', 'Harina de trigo', 'Cerveza roja', 'Huevo', 'Ajo asado'],
    allergens: ['gluten', 'egg'],
    nutrition: [200, 420, 6, 44, 24],
    prepTimeMinutes: 9,
    tags: ['vegetariano'],
    createdAt: '2026-05-02',
    tones: ['#c88a30', '#f4d090'],
  },
  // ------------------------------------------------ postres
  {
    id: 'bc-brownie-brasa',
    title: 'Brownie a la brasa con helado',
    description:
      'Brownie de chocolate 70 % calentado en la parrilla, con helado de vainilla y nueces tostadas.',
    price: 16_900,
    categoryId: 'postres',
    ingredients: [
      'Chocolate 70 %',
      'Mantequilla',
      'Huevo',
      'Harina de trigo',
      'Nueces',
      'Helado de vainilla',
    ],
    allergens: ['gluten', 'dairy', 'egg', 'nuts'],
    nutrition: [180, 610, 8, 62, 36],
    prepTimeMinutes: 7,
    tags: ['recomendado'],
    createdAt: '2026-02-20',
    tones: ['#3a1e14', '#a0643a'],
  },
  {
    id: 'bc-arroz-coco',
    title: 'Arroz con leche de coco',
    description: 'Arroz cremoso con leche de coco, panela, canela y coco tostado.',
    price: 12_900,
    categoryId: 'postres',
    ingredients: ['Arroz', 'Leche de coco', 'Panela', 'Canela', 'Coco rallado'],
    allergens: [],
    nutrition: [200, 380, 5, 58, 14],
    prepTimeMinutes: 4,
    tags: ['vegano', 'sin gluten'],
    createdAt: '2026-06-01',
    tones: ['#f2e6cc', '#b8864a'],
  },
  {
    id: 'bc-pie-maracuya',
    title: 'Pie de maracuyá',
    description: 'Base de galleta y mantequilla, crema de maracuyá y merengue quemado al momento.',
    price: 14_900,
    categoryId: 'postres',
    ingredients: ['Maracuyá', 'Leche condensada', 'Galleta', 'Mantequilla', 'Clara de huevo'],
    allergens: ['gluten', 'dairy', 'egg'],
    nutrition: [150, 420, 6, 54, 20],
    prepTimeMinutes: 5,
    createdAt: '2026-04-12',
    tones: ['#f2c230', '#fff0c0'],
  },
  // ------------------------------------------------ bebidas
  {
    id: 'bc-limonada-hierbabuena',
    title: 'Limonada de hierbabuena',
    description: 'Limón tahití, hierbabuena fresca y un toque de panela. Granizada.',
    price: 9_900,
    categoryId: 'bebidas',
    ingredients: ['Limón tahití', 'Hierbabuena', 'Panela', 'Hielo'],
    allergens: [],
    nutrition: [350, 120, 0, 30, 0],
    optionGroups: [TAMANO_BEBIDA],
    prepTimeMinutes: 4,
    tags: ['vegano'],
    createdAt: '2026-01-10',
    tones: ['#a8d870', '#f0f8c8'],
  },
  {
    id: 'bc-te-jamaica',
    title: 'Té de jamaica frío',
    description:
      'Infusión de flor de jamaica con jengibre y cáscara de naranja, endulzada con miel.',
    price: 8_900,
    categoryId: 'bebidas',
    ingredients: ['Flor de jamaica', 'Jengibre', 'Naranja', 'Miel'],
    allergens: [],
    nutrition: [350, 90, 0, 22, 0],
    optionGroups: [TAMANO_BEBIDA],
    prepTimeMinutes: 3,
    createdAt: '2026-01-10',
    tones: ['#8a1a3a', '#e07090'],
  },
  {
    id: 'bc-jugo-lulo',
    title: 'Jugo de lulo',
    description: 'Lulo de Nariño recién despulpado, en agua o en leche.',
    price: 8_900,
    categoryId: 'bebidas',
    ingredients: ['Lulo', 'Azúcar de caña'],
    allergens: [],
    nutrition: [350, 110, 1, 26, 0],
    optionGroups: [
      {
        id: 'preparacion',
        label: 'Preparación',
        min: 1,
        max: 1,
        options: [option('agua', 'En agua'), option('leche', 'En leche', 1_500, ['dairy'])],
      },
    ],
    prepTimeMinutes: 4,
    createdAt: '2026-03-15',
    tones: ['#d8b020', '#f8e890'],
  },
  {
    id: 'bc-cerveza-roja',
    title: 'Cerveza artesanal Brasa Roja',
    description:
      'Red ale de la casa, maltosa y con final a caramelo. Botella de 330 ml. Solo mayores de 18 años.',
    price: 14_900,
    categoryId: 'bebidas',
    ingredients: ['Malta de cebada', 'Lúpulo', 'Levadura', 'Agua'],
    allergens: ['gluten'],
    nutrition: [330, 170, 2, 14, 0],
    prepTimeMinutes: 1,
    tags: ['+18'],
    createdAt: '2026-05-20',
    tones: ['#8a2a10', '#e89040'],
  },
]

function toNutrition([
  servingGrams,
  kcal,
  proteinGrams,
  carbsGrams,
  fatGrams,
]: Draft['nutrition']): Nutrition {
  return { servingGrams, kcal, proteinGrams, carbsGrams, fatGrams }
}

export const products: readonly FoodItem[] = drafts.map((draft) => ({
  kind: 'food',
  id: draft.id,
  slug: draft.id.replace(/^bc-/, ''),
  title: draft.title,
  description: draft.description,
  price: money(draft.price, 'COP'),
  media: [
    placeholderMedia(`${draft.title} servido en plato de barro`, [draft.tones[0], draft.tones[1]], {
      width: 1200,
      height: 900,
      angle: 135,
    }),
  ],
  categoryId: draft.categoryId,
  tags: draft.tags ?? [],
  createdAt: draft.createdAt,
  ingredients: draft.ingredients,
  allergens: draft.allergens,
  nutrition: toNutrition(draft.nutrition),
  optionGroups: draft.optionGroups ?? [],
  prepTimeMinutes: draft.prepTimeMinutes,
  spiceLevel: draft.spiceLevel ?? 0,
  available: draft.available ?? true,
}))
